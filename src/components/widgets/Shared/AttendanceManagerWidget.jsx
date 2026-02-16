import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import * as classService from '../../../services/classService';
import * as attendanceSessionService from '../../../services/attendanceSessionService';
import * as attendanceRecordService from '../../../services/attendanceRecordService';
import * as userService from '../../../services/userService';
import * as reportService from '../../../services/reportService';
import { printAttendance, exportToPDF, printMonthlyAttendance, exportMonthlyToPDF } from '../../../utils/printExport';
import { roleHasPermission } from '../../../utils/rolePermissions';

const STATUS_OPTIONS = ['present', 'absent', 'late', 'excused'];

export default function AttendanceManagerWidget({ assignedClassesOnly = false, readOnly = false }) {
  const { currentUser, userProfile, role } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [exportMode, setExportMode] = useState('class');

  // Load classes (all or assigned only)
  useEffect(() => {
    setLoading(true);
    setError(null);
    let unsub;

    if (assignedClassesOnly && currentUser) {
      unsub = classService.subscribeClassesForInstructor(currentUser.uid, (data) => {
        setClasses(data);
        setLoading(false);
      });
    } else {
      unsub = classService.subscribeClasses((data) => {
        setClasses(data);
        setLoading(false);
      });
    }

    return () => unsub && unsub();
  }, [assignedClassesOnly, currentUser]);

  // Load sessions for selected class
  useEffect(() => {
    if (!selectedClassId) {
      setSessions([]);
      setSelectedSessionId('');
      return;
    }

    const unsub = attendanceSessionService.subscribeSessionsByClass(selectedClassId, (data) => {
      setSessions(data);
    });

    return () => unsub && unsub();
  }, [selectedClassId]);

  // Load attendance records for selected session
  useEffect(() => {
    if (!selectedSessionId || !selectedClassId) {
      setRecords([]);
      return;
    }

    const unsub = attendanceRecordService.subscribeRecordsBySession(selectedSessionId, (data) => {
      setRecords(data);
    });

    return () => unsub && unsub();
  }, [selectedSessionId, selectedClassId]);

  async function handleCreateSession(e) {
    e.preventDefault();
    if (!selectedClassId || !currentUser) return;

    try {
      setError(null);
      const sessionDate = e.target.sessionDate.value;
      const notes = e.target.notes.value;
      await attendanceSessionService.createSession({
        classId: selectedClassId,
        sessionDate: new Date(sessionDate).toISOString(),
        notes,
        createdBy: currentUser.uid,
      });
      e.target.reset();
    } catch (err) {
      setError('Failed to create session: ' + err.message);
    }
  }

  async function handleMarkAttendance(participantUID, status) {
    if (!selectedSessionId || !currentUser) return;

    try {
      setError(null);
      await attendanceRecordService.markAttendance(
        selectedSessionId,
        participantUID,
        status,
        currentUser.uid
      );
    } catch (err) {
      setError('Failed to mark attendance: ' + err.message);
    }
  }

  async function handlePrint() {
    if (!currentSession || !selectedClassId) return;
    const classRecord = classes.find((c) => c.id === selectedClassId);
    const mockParticipants = [
      { uid: 'p1', name: 'John Smith' },
      { uid: 'p2', name: 'Jane Doe' },
      { uid: 'p3', name: 'Sam Johnson' },
    ];
    const reportData = {
      sessionDate: currentSession.sessionDate,
      className: classRecord?.name || 'Unknown Class',
      instructorName: userProfile?.fullName || 'Unknown',
      notes: currentSession.notes,
      records: mockParticipants.map((p) => {
        const record = records.find((r) => r.participantUID === p.uid);
        return {
          participantName: p.name,
          status: record?.status || 'absent',
          markedAt: record?.markedAt,
        };
      }),
    };
    printAttendance(reportData);
  }

  async function handleExportPDF() {
    if (!currentSession || !selectedClassId) return;
    try {
      setExporting(true);
      setError(null);
      const classRecord = classes.find((c) => c.id === selectedClassId);
      const mockParticipants = [
        { uid: 'p1', name: 'John Smith' },
        { uid: 'p2', name: 'Jane Doe' },
        { uid: 'p3', name: 'Sam Johnson' },
      ];
      const reportData = {
        sessionDate: currentSession.sessionDate,
        className: classRecord?.name || 'Unknown Class',
        instructorName: userProfile?.fullName || 'Unknown',
        notes: currentSession.notes,
        records: mockParticipants.map((p) => {
          const record = records.find((r) => r.participantUID === p.uid);
          return {
            participantName: p.name,
            status: record?.status || 'absent',
            markedAt: record?.markedAt,
          };
        }),
        filename: `${classRecord?.name || 'attendance'}-${new Date().toISOString().split('T')[0]}.pdf`,
      };
      await exportToPDF(reportData);
    } catch (err) {
      setError('Failed to export PDF: ' + err.message);
    } finally {
      setExporting(false);
    }
  }

  async function handleGlobalMonthlyExport(format = 'print') {
    if (!selectedMonth) return;
    try {
      setExporting(true);
      setError(null);

      // Fetch aggregated report data from service
      const reportData = await reportService.generateGlobalMonthlyReport(selectedMonth);

      // Pass to export utility
      if (format === 'print') {
        printMonthlyAttendance(reportData);
      } else {
        const filename = `YSA-GP-Monthly-Report-${selectedMonth}.pdf`;
        await exportMonthlyToPDF({ ...reportData, filename });
      }
    } catch (err) {
      setError(`Failed to export: ${err.message}`);
    } finally {
      setExporting(false);
    }
  }

  async function handleClassMonthlyExport(format = 'print') {
    if (!selectedMonth || !selectedClassId) return;
    try {
      setExporting(true);
      setError(null);

      // Fetch aggregated report data from service
      const reportData = await reportService.generateClassMonthlyReport(selectedClassId, selectedMonth);

      // Pass to export utility
      if (format === 'print') {
        printMonthlyAttendance(reportData);
      } else {
        const classRecord = classes.find((c) => c.id === selectedClassId);
        const filename = `${classRecord?.name || 'class'}-Monthly-Report-${selectedMonth}.pdf`;
        await exportMonthlyToPDF({ ...reportData, filename });
      }
    } catch (err) {
      setError(`Failed to export: ${err.message}`);
    } finally {
      setExporting(false);
    }
  }

  const currentSession = sessions.find((s) => s.id === selectedSessionId);
  const mockParticipants = [
    { uid: 'p1', name: 'John Smith' },
    { uid: 'p2', name: 'Jane Doe' },
    { uid: 'p3', name: 'Sam Johnson' },
  ];

  return (
    <div className="space-y-4">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

      {/* Export Controls Section */}
      <div className="p-3 bg-gray-50 rounded space-y-3">
        <div className="text-sm font-medium text-gray-700">Monthly Report Options</div>

        {/* Month Selector */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Select Month</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        {/* Export Mode Toggle - Only show if user can view global reports (admin/leader) */}
        {roleHasPermission(role, 'view') && (role === 'admin' || role === 'leader') && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Report Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="exportMode"
                  value="class"
                  checked={exportMode === 'class'}
                  onChange={(e) => setExportMode(e.target.value)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Class Report</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="exportMode"
                  value="global"
                  checked={exportMode === 'global'}
                  onChange={(e) => setExportMode(e.target.value)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Global Report (All Classes)</span>
              </label>
            </div>
          </div>
        )}

        {/* Class Selector - Only show for class mode */}
        {exportMode === 'class' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Select Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">-- Choose a class --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Monthly Export Buttons */}
        <div className="flex gap-2 pt-2">
          {exportMode === 'global' ? (
            <>
              <button
                onClick={() => handleGlobalMonthlyExport('print')}
                disabled={!selectedMonth || exporting}
                className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
              >
                {exporting ? 'Preparing...' : 'Print Global Report'}
              </button>
              <button
                onClick={() => handleGlobalMonthlyExport('pdf')}
                disabled={!selectedMonth || exporting}
                className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
              >
                {exporting ? 'Preparing...' : 'Export to PDF'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleClassMonthlyExport('print')}
                disabled={!selectedMonth || !selectedClassId || exporting}
                className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
              >
                {exporting ? 'Preparing...' : 'Print Class Report'}
              </button>
              <button
                onClick={() => handleClassMonthlyExport('pdf')}
                disabled={!selectedMonth || !selectedClassId || exporting}
                className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
              >
                {exporting ? 'Preparing...' : 'Export to PDF'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Class Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Select Class (For Real-Time Marking)</label>
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="mt-1 w-full border rounded px-3 py-2 text-sm"
          disabled={readOnly}
        >
          <option value="">-- Choose a class --</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Create Session Form */}
      {!readOnly && selectedClassId && (
        <form onSubmit={handleCreateSession} className="p-3 bg-blue-50 rounded space-y-2">
          <div className="text-sm font-medium text-gray-700">Create New Session</div>
          <input
            type="date"
            name="sessionDate"
            required
            className="w-full border rounded px-2 py-1 text-sm"
          />
          <textarea
            name="notes"
            placeholder="Session notes (optional)"
            className="w-full border rounded px-2 py-1 text-sm"
            rows={2}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            Create Session
          </button>
        </form>
      )}

      {/* Session Selector */}
      {selectedClassId && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Session</label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2 text-sm"
          >
            <option value="">-- Choose a session --</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {new Date(s.sessionDate).toLocaleDateString()} {s.notes ? `- ${s.notes}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Attendance Table */}
      {selectedSessionId && currentSession && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">
              {currentSession.notes || 'Session'} — Mark Attendance
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 no-print"
              >
                Print
              </button>
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 no-print"
              >
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>
            </div>
          </div>
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">Participant</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Marked At</th>
                </tr>
              </thead>
              <tbody>
                {mockParticipants.map((p) => {
                  const record = records.find((r) => r.participantUID === p.uid);
                  return (
                    <tr key={p.uid} className="border-t">
                      <td className="px-3 py-2">{p.name}</td>
                      <td className="px-3 py-2">
                        {readOnly ? (
                          <span className="text-gray-600">{record?.status || '—'}</span>
                        ) : (
                          <select
                            value={record?.status || 'present'}
                            onChange={(e) => handleMarkAttendance(p.uid, e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                          >
                            {STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-500 text-xs">
                        {record?.markedAt ? new Date(record.markedAt.toDate?.() || record.markedAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
