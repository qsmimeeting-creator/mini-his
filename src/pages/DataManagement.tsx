import React, { useState, useMemo } from 'react';
import { 
  Download, Search, Filter, Calendar, 
  TrendingUp, Users, CheckCircle, XCircle,
  FileSpreadsheet, BarChart3, PieChart as PieChartIcon,
  Eye
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay, isValid } from 'date-fns';
import { useAppContext } from '../context/AppContext';
import { STATUS_LABELS, STATUS_COLORS } from '../constants';
import { PatientDetailsModal } from '../components/common/PatientDetailsModal';

export default function DataManagement() {
  const { visits, patients } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-01'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Filtered data
  const filteredVisits = useMemo(() => {
    return visits.filter(visit => {
      let visitDate;
      try {
        visitDate = parseISO(visit.timestamp);
        if (!isValid(visitDate)) return false;
      } catch (e) {
        return false;
      }

      const isWithinDate = isWithinInterval(visitDate, {
        start: startOfDay(parseISO(startDate)),
        end: endOfDay(parseISO(endDate))
      });

      const matchesSearch = 
        visit.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.vn.toLowerCase().includes(searchTerm.toLowerCase());

      return isWithinDate && matchesSearch;
    });
  }, [visits, startDate, endDate, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredVisits.length;
    const completed = filteredVisits.filter(v => v.status === 'COMPLETED').length;
    const voided = filteredVisits.filter(v => v.status === 'VOID').length;
    const inProgress = total - completed - voided;

    return { total, completed, voided, inProgress };
  }, [filteredVisits]);

  // Chart Data: Visits by day
  const chartData = useMemo(() => {
    const dailyData: Record<string, number> = {};
    filteredVisits.forEach(v => {
      try {
        const dateObj = parseISO(v.timestamp);
        if (isValid(dateObj)) {
          const date = format(dateObj, 'dd/MM');
          dailyData[date] = (dailyData[date] || 0) + 1;
        }
      } catch (e) {
        // Skip invalid dates
      }
    });

    return Object.entries(dailyData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredVisits]);

  // Chart Data: Status distribution
  const pieData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    filteredVisits.forEach(v => {
      const label = STATUS_LABELS[v.status] || v.status;
      statusCounts[label] = (statusCounts[label] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [filteredVisits]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Export CSV
  const exportToCSV = () => {
    const headers = ['VN', 'Patient Name', 'Status', 'Date', 'Time'];
    const rows = filteredVisits.map(v => {
      try {
        const date = parseISO(v.timestamp);
        if (isValid(date)) {
          return [
            v.vn,
            v.patientName,
            STATUS_LABELS[v.status] || v.status,
            format(date, 'yyyy-MM-dd'),
            format(date, 'HH:mm:ss')
          ];
        }
      } catch (e) {
        // Fallback
      }
      return [v.vn, v.patientName, STATUS_LABELS[v.status] || v.status, v.timestamp, ''];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `report_${startDate}_to_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการข้อมูลและรายงาน</h1>
          <p className="text-gray-500">ตรวจสอบข้อมูล กรองรายงาน และดาวน์โหลดข้อมูลสรุปผล</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm font-medium"
        >
          <Download size={18} />
          ดาวน์โหลดรายงาน (CSV)
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
          <Filter size={18} className="text-blue-600" />
          ตัวกรองข้อมูล
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">วันที่เริ่มต้น</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">วันที่สิ้นสุด</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">ค้นหารายชื่อ / VN</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="ค้นหาชื่อผู้ป่วย หรือเลข VN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Users size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500">ผู้รับบริการทั้งหมด</span>
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-gray-400 mt-1">ในช่วงเวลาที่เลือก</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500">เสร็จสิ้นแล้ว</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
          <div className="text-xs text-gray-400 mt-1">({stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%)</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500">กำลังดำเนินการ</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.inProgress}</div>
          <div className="text-xs text-gray-400 mt-1">รอรับบริการขั้นตอนต่างๆ</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <XCircle size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500">ยกเลิกบริการ</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.voided}</div>
          <div className="text-xs text-gray-400 mt-1">รายการที่ถูก Void</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-gray-800 font-bold">
            <BarChart3 size={20} className="text-blue-600" />
            สถิติผู้รับบริการรายวัน
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="จำนวนผู้ป่วย" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-gray-800 font-bold">
            <PieChartIcon size={20} className="text-indigo-600" />
            สัดส่วนสถานะการรับบริการ
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-gray-800">
            <FileSpreadsheet size={20} className="text-emerald-600" />
            รายการผู้รับบริการ
          </div>
          <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            พบ {filteredVisits.length} รายการ
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">VN</th>
                <th className="px-6 py-4">ชื่อ-นามสกุล</th>
                <th className="px-6 py-4">วันเวลาที่รับบริการ</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-6 py-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVisits.length > 0 ? (
                filteredVisits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm font-bold text-blue-600">{visit.vn}</td>
                    <td className="px-6 py-4 font-medium">{visit.patientName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {(() => {
                        try {
                          const date = parseISO(visit.timestamp);
                          return isValid(date) ? format(date, 'dd/MM/yyyy HH:mm') : visit.timestamp;
                        } catch (e) {
                          return visit.timestamp;
                        }
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[visit.status]}`}>
                        {STATUS_LABELS[visit.status] || visit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedPatientId(visit.patientId)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="ดูรายละเอียดผู้ป่วย"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    ไม่พบข้อมูลในช่วงเวลาที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {selectedPatientId && (
        <PatientDetailsModal 
          patientId={selectedPatientId} 
          onClose={() => setSelectedPatientId(null)} 
        />
      )}
    </div>
  );
}
