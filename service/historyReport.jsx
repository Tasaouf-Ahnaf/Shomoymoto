import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { collection, getDocs, query, where } from "firebase/firestore";
import moment from "moment";
import "moment/locale/bn";
import { auth, db } from "../config/FirebaseConfig";
import { getLocalStorage } from "./storage";

const escapeHtml = (str = "") =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const toJsDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  if (Number.isFinite(value?.seconds)) {
    return new Date(value.seconds * 1000);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// Build list of calendar days with BOTH English and Bengali "D/MMM/YYYY" keys
const buildReportDays = (startDate, endDate) => {
  const start = moment(startDate).startOf("day");
  const end = moment(endDate).startOf("day");
  const days = [];
  const cursor = start.clone();

  while (cursor.isSameOrBefore(end, "day")) {
    days.push({
      momentObj: cursor.clone(),
      enKey: cursor.clone().locale("en").format("D/MMM/YYYY"),
      bnKey: cursor.clone().locale("bn").format("D/MMM/YYYY"),
      displayDate: cursor.clone().locale("en").format("DD MMM YYYY"),
      shortDate: cursor.clone().locale("en").format("DD<br/>MMM"),
      shortLabel: cursor.clone().locale("en").format("DD MMM"),
    });
    cursor.add(1, "day");
  }
  return days;
};

// Matches whether a medication is scheduled on a given day (handles EN dates, BN dates, or startDate-endDate)
const isMedScheduledOnDay = (med, day) => {
  const dates = med?.dates || [];
  if (dates.includes(day.enKey) || dates.includes(day.bnKey)) {
    return true;
  }

  // Fallback: check startDate and endDate timestamps if `dates` array format differs
  const start = toJsDate(med?.startDate);
  const end = toJsDate(med?.endDate);
  if (start && end) {
    const startM = moment(start).startOf("day");
    const endM = moment(end).endOf("day");
    return day.momentObj.isBetween(startM, endM, "day", "[]");
  }

  return false;
};

// Matches Taken/Missed from Firestore `action` array (handles both EN and BN date strings)
const getStatusForDay = (med, day) => {
  const actions = med?.action || [];
  const matchDate = (item) =>
    item?.date === day.enKey || item?.date === day.bnKey;

  if (actions.some((item) => item?.status === "Taken" && matchDate(item))) {
    return "Taken";
  }
  if (actions.some((item) => item?.status === "Missed" && matchDate(item))) {
    return "Missed";
  }

  if (day.momentObj.clone().endOf("day").isBefore(moment())) {
    return "Missed";
  }

  return "Pending";
};

const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

// Directly fetch user's medications from Firebase Firestore
const fetchUserMedicationsFromFirebase = async () => {
  const storedUser = await getLocalStorage("userDetail");
  const email = auth.currentUser?.email || storedUser?.email;
  if (!email) {
    throw new Error("No logged-in user found");
  }

  const q = query(
    collection(db, "medication"),
    where("userEmail", "==", email),
  );
  const snapshot = await getDocs(q);
  const meds = [];
  snapshot.forEach((docSnap) => {
    meds.push({
      ...docSnap.data(),
      docId: docSnap.data()?.docId || docSnap.id,
    });
  });

  return {
    user: {
      email,
      displayName:
        auth.currentUser?.displayName || storedUser?.displayName || "User",
    },
    meds,
  };
};

export const buildHistoryReportHtml = ({
  user,
  startDate,
  endDate,
  allMeds = [],
}) => {
  const days = buildReportDays(startDate, endDate);

  let totalScheduled = 0;
  let totalTaken = 0;
  let totalMissed = 0;

  const activeMedMap = new Map();

  // Part 1: Date-wise Medication Log
  const dateSectionsHtml = days
    .map((day) => {
      const medsOnDate = allMeds.filter((med) => isMedScheduledOnDay(med, day));
      if (medsOnDate.length === 0) return "";

      const rowsHtml = medsOnDate
        .map((med) => {
          const medKey = med.docId || `${med.name}-${med.dose}`;
          if (!activeMedMap.has(medKey)) {
            activeMedMap.set(medKey, med);
          }

          const status = getStatusForDay(med, day);
          totalScheduled += 1;
          if (status === "Taken") totalTaken += 1;
          if (status === "Missed") totalMissed += 1;

          const reminderDate = toJsDate(med.reminder);
          const timeText = reminderDate
            ? moment(reminderDate).locale("en").format("h:mm A")
            : "-";

          const badgeClass =
            status === "Taken"
              ? "badge-taken"
              : status === "Missed"
                ? "badge-missed"
                : "badge-pending";

          return `
            <li>
              <span class="med-name">${escapeHtml(med.name)}</span>
              ${med.dose ? `<span class="med-dose">(${escapeHtml(med.dose)})</span>` : ""}
              &nbsp;&mdash;&nbsp;
              <span class="med-time">${escapeHtml(timeText)}</span>
              &nbsp;&mdash;&nbsp;
              <span class="badge ${badgeClass}">${status}</span>
            </li>
          `;
        })
        .join("");

      return `
        <div class="day-block">
          <div class="day-title">${escapeHtml(day.displayDate)}</div>
          <ul class="day-list">${rowsHtml}</ul>
        </div>
      `;
    })
    .filter(Boolean)
    .join("");

  const activeMeds = Array.from(activeMedMap.values());
  const adherence =
    totalTaken + totalMissed > 0
      ? Math.round((totalTaken / (totalTaken + totalMissed)) * 100)
      : 0;

  // Part 2: Medicine-wise Summary Table (7-day chunks across multiple pages)
  const dayChunks = chunkArray(days, 7);
  const matrixTablesHtml =
    activeMeds.length === 0
      ? `<p class="empty">No medications scheduled in this date range.</p>`
      : dayChunks
          .map((chunk, idx) => {
            const rangeTitle = `${chunk[0].shortLabel} – ${
              chunk[chunk.length - 1].displayDate
            }`;

            const headerCells = chunk
              .map((d) => `<th>${d.shortDate}</th>`)
              .join("");

            const bodyRows = activeMeds
              .map((med) => {
                const cells = chunk
                  .map((day) => {
                    if (!isMedScheduledOnDay(med, day)) {
                      return `<td class="cell-na">&mdash;</td>`;
                    }
                    const status = getStatusForDay(med, day);
                    if (status === "Taken") {
                      return `<td class="cell-taken">&#10004;</td>`;
                    }
                    if (status === "Missed") {
                      return `<td class="cell-missed">&#10008;</td>`;
                    }
                    return `<td class="cell-pending">&bull;</td>`;
                  })
                  .join("");

                return `
                  <tr>
                    <td class="med-col">
                      <strong>${escapeHtml(med.name)}</strong>
                      ${med.dose ? `<div class="sub">${escapeHtml(med.dose)}</div>` : ""}
                    </td>
                    ${cells}
                  </tr>
                `;
              })
              .join("");

            return `
              <div class="table-wrap">
                <div class="chunk-label">Period ${idx + 1}: ${escapeHtml(rangeTitle)}</div>
                <table>
                  <thead>
                    <tr>
                      <th class="med-col">Medicine</th>
                      ${headerCells}
                    </tr>
                  </thead>
                  <tbody>${bodyRows}</tbody>
                </table>
              </div>
            `;
          })
          .join("");

  const rangeHeader = `${moment(startDate)
    .locale("en")
    .format("DD MMM YYYY")} to ${moment(endDate)
    .locale("en")
    .format("DD MMM YYYY")}`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { size: A4; margin: 16mm 14mm; }
          body { font-family: Helvetica, Arial, sans-serif; color: #1f2937; padding: 0; font-size: 12px; }
          .header { border-bottom: 2px solid #0F4D0F; padding-bottom: 10px; margin-bottom: 16px; }
          .header h1 { margin: 0; color: #0F4D0F; font-size: 20px; }
          .meta { margin-top: 6px; color: #4b5563; font-size: 11px; line-height: 1.5; }
          .stats { display: flex; gap: 10px; margin-bottom: 18px; }
          .stat-box { flex: 1; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px; text-align: center; background: #f9fafb; }
          .stat-num { font-size: 16px; font-weight: bold; color: #0F4D0F; }
          .stat-label { font-size: 10px; color: #6b7280; margin-top: 2px; }
          h2 { font-size: 15px; color: #0F4D0F; border-left: 4px solid #2E8B57; padding-left: 8px; margin: 18px 0 10px; }
          .section-break { page-break-before: always; break-before: page; }
          .day-block { margin-bottom: 10px; padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 6px; page-break-inside: avoid; }
          .day-title { font-weight: bold; color: #111827; margin-bottom: 4px; font-size: 12.5px; }
          .day-list { margin: 0; padding-left: 18px; }
          .day-list li { margin: 3px 0; }
          .med-name { font-weight: bold; }
          .med-dose { color: #4b5563; }
          .badge { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
          .badge-taken { background: #C8E6C9; color: #1B5E20; }
          .badge-missed { background: #FFCDD2; color: #B71C1C; }
          .badge-pending { background: #E5E7EB; color: #374151; }
          .table-wrap { margin-bottom: 14px; page-break-inside: avoid; }
          .chunk-label { font-weight: bold; font-size: 11px; color: #374151; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; break-inside: avoid; }
          th, td { border: 1px solid #d1d5db; padding: 5px 4px; text-align: center; font-size: 11px; }
          th { background: #F1F8F4; color: #0F4D0F; }
          .med-col { width: 30%; text-align: left; padding-left: 6px; }
          .sub { font-size: 9.5px; color: #6b7280; font-weight: normal; }
          .cell-taken { color: #1B5E20; background: #E8F5E9; font-weight: bold; font-size: 13px; }
          .cell-missed { color: #C62828; background: #FFEBEE; font-weight: bold; font-size: 13px; }
          .cell-pending { color: #6B7280; }
          .cell-na { color: #9CA3AF; }
          .legend { font-size: 10.5px; color: #4b5563; margin-bottom: 8px; }
          .empty { color: #6b7280; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Shomoymoto — Medication History Report</h1>
          <div class="meta">
            <div><strong>Patient:</strong> ${escapeHtml(user?.displayName || "User")} (${escapeHtml(user?.email || "")})</div>
            <div><strong>Date Range:</strong> ${escapeHtml(rangeHeader)}</div>
            <div><strong>Generated:</strong> ${escapeHtml(moment().locale("en").format("DD MMM YYYY, h:mm A"))}</div>
          </div>
        </div>

        <div class="stats">
          <div class="stat-box"><div class="stat-num">${totalScheduled}</div><div class="stat-label">Scheduled</div></div>
          <div class="stat-box"><div class="stat-num" style="color:#1B5E20;">${totalTaken}</div><div class="stat-label">Taken</div></div>
          <div class="stat-box"><div class="stat-num" style="color:#C62828;">${totalMissed}</div><div class="stat-label">Missed</div></div>
          <div class="stat-box"><div class="stat-num">${adherence}%</div><div class="stat-label">Adherence</div></div>
        </div>

        <h2>1. Date-wise Medication Log</h2>
        ${
          dateSectionsHtml ||
          `<p class="empty">No medication records found for this date range.</p>`
        }

        <h2 class="section-break">2. Medicine-wise Summary Table</h2>
        <div class="legend">
          <strong style="color:#1B5E20;">&#10004;</strong> Taken &nbsp;&nbsp;
          <strong style="color:#C62828;">&#10008;</strong> Missed &nbsp;&nbsp;
          <strong>&bull;</strong> Upcoming &nbsp;&nbsp;
          <strong>&mdash;</strong> Not Scheduled
        </div>
        ${matrixTablesHtml}
      </body>
    </html>
  `;
};

// Opens native PDF Preview screen where user can view all pages AND tap "Save as PDF" to download
export const viewAndSaveHistoryPdf = async ({ startDate, endDate }) => {
  const { user, meds } = await fetchUserMedicationsFromFirebase();
  const html = buildHistoryReportHtml({
    user,
    startDate,
    endDate,
    allMeds: meds,
  });

  await Print.printAsync({ html });
};

// Optional: if user explicitly wants to share the PDF file
export const shareHistoryPdf = async ({ startDate, endDate }) => {
  const { user, meds } = await fetchUserMedicationsFromFirebase();
  const html = buildHistoryReportHtml({
    user,
    startDate,
    endDate,
    allMeds: meds,
  });

  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Shomoymoto Medication Report",
      UTI: "com.adobe.pdf",
    });
  } else {
    await Print.printAsync({ html });
  }
  return uri;
};
