import prisma from '../prisma';
import { getProfileStats } from './analyticsService';

export const generateCSVReport = async (userId: string): Promise<string> => {
  const logs = await prisma.dailyLog.findMany({
    where: { userId },
    orderBy: { date: 'desc' }
  });

  const headers = ['Date', 'Mood', 'Sleep (hours)', 'Energy (1-10)', 'Stress (1-10)', 'Hydration (cups)', 'Menstrual Flow', 'HRV (ms)', 'Symptoms'];
  const rows = logs.map(l => [
    l.date,
    l.mood,
    l.sleepHours,
    l.energyRate,
    l.stressFactor,
    l.hydrationCups,
    l.flowType,
    l.hrv !== null ? l.hrv : '',
    `"${l.symptoms.join(', ')}"`
  ]);

  return [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');
};

export const generateDoctorHTMLReport = async (userId: string): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true }
  });
  if (!user) throw new Error('User not found');

  const stats = await getProfileStats(userId);
  const logs = await prisma.dailyLog.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 200
  });

  // Calculate top symptoms in report from all user logs
  const symptomCounts: Record<string, number> = {};
  const allUserLogsForSymptoms = await prisma.dailyLog.findMany({
    where: { userId },
    select: { symptoms: true }
  });
  allUserLogsForSymptoms.forEach(l => {
    l.symptoms.forEach(s => {
      symptomCounts[s] = (symptomCounts[s] || 0) + 1;
    });
  });
  const topSymptomsList = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([symptom, count]) => `<span class="symptom-tag">${symptom} (${count}x)</span>`)
    .join(' ');

  const onboarding = await prisma.onboarding.findUnique({
    where: { userId }
  });

  const userName = `${user.firstName} ${user.lastName}`;
  const reportDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Mood rows HTML
  const moodRows = Object.entries(stats.moodDistribution)
    .map(([mood, pct]) => `
      <div class="mood-bar-container">
        <span class="mood-label">${mood}</span>
        <div class="mood-bar-track">
          <div class="mood-bar-fill" style="width: ${pct}%"></div>
        </div>
        <span class="mood-pct">${pct}%</span>
      </div>
    `).join('');

  // Logs table rows HTML
  const logsTableRows = logs.map(l => `
    <tr>
      <td class="bold">${l.date}</td>
      <td>${l.mood}</td>
      <td>${l.sleepHours} hrs</td>
      <td>${l.energyRate}/10</td>
      <td>${l.stressFactor}/10</td>
      <td>${l.hydrationCups} cups</td>
      <td>${l.flowType !== 'NONE' ? `<span class="flow-badge">${l.flowType}</span>` : 'None'}</td>
      <td>${l.hrv ? `${l.hrv} ms` : 'N/A'}</td>
      <td class="symptoms-list">${l.symptoms.length > 0 ? l.symptoms.join(', ') : 'None'}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>LunaCare Health Report - ${userName}</title>
  <style>
    :root {
      --primary: #a53556;
      --secondary: #64748b;
      --dark: #0f172a;
      --light: #f8fafc;
      --border: #e2e8f0;
      --accent: #ff7b9c;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: var(--dark);
      background-color: #fff;
      line-height: 1.5;
      margin: 0;
      padding: 40px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid var(--primary);
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-mark {
      width: 32px;
      height: 32px;
      background-color: var(--primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: bold;
      font-size: 18px;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 800;
      color: var(--primary);
      letter-spacing: -0.5px;
    }
    .meta-info {
      text-align: right;
      font-size: 13px;
      color: var(--secondary);
    }
    .meta-info h1 {
      font-size: 20px;
      margin: 0 0 5px 0;
      color: var(--dark);
    }
    .grid {
      display: grid;
      grid-template-cols: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      background-color: var(--light);
    }
    .card-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--secondary);
      margin-bottom: 15px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 5px;
    }
    .metric-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .metric-row:last-child {
      margin-bottom: 0;
    }
    .bold {
      font-weight: 700;
    }
    .stat-val {
      color: var(--primary);
    }
    .mood-bar-container {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      font-size: 13px;
    }
    .mood-label {
      width: 80px;
      font-weight: 600;
    }
    .mood-bar-track {
      flex: 1;
      height: 8px;
      background-color: var(--border);
      border-radius: 4px;
      margin: 0 10px;
      overflow: hidden;
    }
    .mood-bar-fill {
      height: 100%;
      background-color: var(--primary);
      border-radius: 4px;
    }
    .mood-pct {
      width: 40px;
      text-align: right;
      font-weight: bold;
      color: var(--secondary);
    }
    .full-width {
      grid-column: 1 / -1;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      font-size: 13px;
    }
    th {
      background-color: var(--light);
      border-bottom: 2px solid var(--border);
      padding: 10px;
      text-align: left;
      font-weight: 700;
      color: var(--secondary);
    }
    td {
      padding: 10px;
      border-bottom: 1px solid var(--border);
    }
    .flow-badge {
      background-color: var(--accent);
      color: #fff;
      font-weight: bold;
      font-size: 9px;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .symptoms-list {
      color: var(--secondary);
      font-style: italic;
    }
    .symptom-tag {
      background-color: #fff;
      border: 1px solid var(--border);
      color: var(--primary);
      font-weight: 700;
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 8px;
      margin-right: 6px;
      margin-bottom: 6px;
      display: inline-block;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .symptom-list-container {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 10px;
    }
    .footer {
      margin-top: 40px;
      border-top: 1px solid var(--border);
      padding-top: 20px;
      text-align: center;
      font-size: 12px;
      color: var(--secondary);
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
      .card {
        page-break-inside: avoid;
      }
      table {
        page-break-inside: auto;
      }
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
    }
    .print-btn-container {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }
    .print-btn {
      background-color: var(--primary);
      color: #fff;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      font-size: 13px;
      transition: opacity 0.2s;
    }
    .print-btn:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="print-btn-container no-print">
      <button class="print-btn" onclick="window.print()">Print or Save as PDF</button>
    </div>

    <div class="header">
      <div class="logo-container">
        <div class="logo-mark">S</div>
        <div class="logo-text">LunaCare</div>
      </div>
      <div class="meta-info">
        <h1>Health Ledger & Diagnostics</h1>
        <div>Report Date: ${reportDate}</div>
        <div>Subject: <span class="bold">${userName}</span></div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-title">Cycle & Period Parameters</div>
        <div class="metric-row">
          <span>Tracking Since</span>
          <span class="bold">${stats.trackingSince}</span>
        </div>
        <div class="metric-row">
          <span>Total Cycles Recorded</span>
          <span class="bold stat-val">${stats.cyclesRecorded}</span>
        </div>
        <div class="metric-row">
          <span>Average Cycle Length</span>
          <span class="bold">${stats.averageCycleLength} days</span>
        </div>
        <div class="metric-row">
          <span>Average Period Flow Duration</span>
          <span class="bold">${stats.averagePeriodLength} days</span>
        </div>
        <div class="metric-row">
          <span>Cycle Drift (Shortest / Longest)</span>
          <span class="bold">${stats.shortestCycleLength || 'N/A'} - ${stats.longestCycleLength || 'N/A'} days</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Logging consistency & streaks</div>
        <div class="metric-row">
          <span>Active Streak</span>
          <span class="bold stat-val">${stats.currentStreak} days</span>
        </div>
        <div class="metric-row">
          <span>Longest Tracking Streak</span>
          <span class="bold">${stats.longestStreak} days</span>
        </div>
        <div class="metric-row">
          <span>Total Logs Submitted</span>
          <span class="bold">${stats.logsSubmitted} logs</span>
        </div>
        <div class="metric-row">
          <span>Calendar Completion Rate</span>
          <span class="bold">${stats.completionRate}%</span>
        </div>
        <div class="metric-row">
          <span>Calibration Confidence Level</span>
          <span class="bold">${stats.predictionAccuracy}%</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Biometric Averages</div>
        <div class="metric-row">
          <span>Average Sleep Duration</span>
          <span class="bold">${stats.averageSleep} hrs</span>
        </div>
        <div class="metric-row">
          <span>Average Stress Score</span>
          <span class="bold">${stats.averageStress}/10</span>
        </div>
        <div class="metric-row">
          <span>Average Daily Hydration</span>
          <span class="bold">${stats.averageHydration} cups</span>
        </div>
        <div class="metric-row">
          <span>Heart Rate Variability (HRV)</span>
          <span class="bold">${stats.averageHrv} ms</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Mood Frequency Distribution</div>
        ${moodRows}
      </div>

      <div class="card full-width">
        <div class="card-title">Top Logged Symptoms Highlights</div>
        <div class="symptom-list-container">
          ${topSymptomsList || '<span class="text-secondary" style="font-style: italic; font-size: 13px;">No symptoms logged yet.</span>'}
        </div>
      </div>

      <div class="card full-width">
        <div class="card-title">Recent Daily Log History (Last 200 Records)</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Mood</th>
              <th>Sleep</th>
              <th>Energy</th>
              <th>Stress</th>
              <th>Hydration</th>
              <th>Flow</th>
              <th>HRV</th>
              <th>Symptoms</th>
            </tr>
          </thead>
          <tbody>
            ${logsTableRows}
          </tbody>
        </table>
      </div>
    </div>

    <div class="footer">
      This document contains private physiological tracking telemetry generated by LunaCare's biometric engine.
      <br>
      <strong>LunaCare &copy; 2026. All medical insights are derived from user-submitted logs.</strong>
    </div>
  </div>
</body>
</html>
  `;
};
