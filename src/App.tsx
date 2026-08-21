import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { Search, Mail, Phone, Users, Building, ChevronRight, Calendar, UserCheck, Heart, Clock, Star } from 'lucide-react';
import Papa from 'papaparse';
import './index.css';

const SPREADSHEET_ID = '1x9Hq0pM_Lmif8x-4CNX7YgVS-S9Y8uotii_00erLVA8';

// Helper component for loading local images with fallbacks
const EmployeeImage = ({ id, name, className }: { id: string, name: string, className: string }) => {
  const [src, setSrc] = useState(`/assets/employees/${id}.png`);
  
  const handleError = () => {
    if (src.endsWith('.png')) {
      setSrc(`/assets/employees/${id}.jpeg`);
    } else if (src.endsWith('.jpeg')) {
      setSrc(`/assets/employees/${id}.jpg`);
    } else {
      setSrc(`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`);
    }
  };

  return <img src={src} alt={name} className={className} onError={handleError} />;
};

const SkeletonCard = () => (
  <div className="skeleton-card skeleton">
    <div className="skeleton-avatar skeleton"></div>
    <div className="skeleton-content">
      <div className="skeleton-text title skeleton"></div>
      <div className="skeleton-text skeleton"></div>
      <div className="skeleton-text pill skeleton"></div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ 
        background: 'rgba(30, 41, 59, 0.9)', 
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        padding: '12px 16px',
        borderRadius: '12px',
        color: '#f8fafc',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>{label}</p>
        <p style={{ margin: 0, color: payload[0].payload.fill || 'var(--primary-color)', fontWeight: '700', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {payload[0].value} <span style={{ fontSize: '0.85rem', fontWeight: '500', opacity: 0.8 }}>{label && label.includes('Ngày') ? 'ngày' : 'công'}</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div style={{ 
        background: 'rgba(30, 41, 59, 0.9)', 
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        padding: '12px 16px',
        borderRadius: '12px',
        color: '#f8fafc',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>{data.name}</p>
        <p style={{ margin: 0, color: data.payload.fill || 'var(--primary-color)', fontWeight: '700', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {data.value} <span style={{ fontSize: '0.85rem', fontWeight: '500', opacity: 0.8 }}>nhân sự</span>
        </p>
      </div>
    );
  }
  return null;
};

function App() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [timesheetData, setTimesheetData] = useState<any>({});
  
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [currentView, setCurrentView] = useState('directory');
  
  // Month selector state
  const [selectedMonth, setSelectedMonth] = useState('08');
  const [loading, setLoading] = useState(true);

  const departments = ['All', ...Array.from(new Set(allEmployees.map(e => e.department ? e.department.trim() : ''))).filter(d => d !== '')];

  // Prepare Chart Data
  const COLORS = ['#38bdf8', '#f472b6', '#fbbf24', '#34d399', '#a78bfa'];
  const pieData = departments.filter(d => d !== 'All').map(dept => ({
    name: dept,
    value: allEmployees.filter(e => e.department && e.department.trim() === dept).length
  }));

  const calculateAttendance = () => {
    let totalWorked = 0;
    let totalLeave = 0;
    Object.values(timesheetData).forEach((ts: any) => {
      totalWorked += parseFloat(ts.totalWorked?.toString().replace(',', '.') || '0');
      totalLeave += parseFloat(ts.totalLeave?.toString().replace(',', '.') || '0');
    });
    return [
      { name: 'Đủ ca (Công)', value: totalWorked, fill: '#4ade80' },
      { name: 'Nghỉ phép (Ngày)', value: totalLeave, fill: '#facc15' }
    ];
  };
  const barData = calculateAttendance();

  // Fetch Employee Data
  useEffect(() => {
    const fetchEmployees = async () => {
      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=HO_SO_NHAN_SU`;
      
      setLoading(true);
      Papa.parse(url, {
        download: true,
        header: true,
        complete: (results) => {
          const parsed = results.data.filter((row: any) => row['Mã nhân viên']).map((row: any) => ({
            id: row['Mã nhân viên'],
            name: row['Họ và Tên'],
            birthYear: row['Năm Sinh'],
            department: row['Bộ phận'],
            startDate: row['Ngày vào làm'],
            profileStatus: row['Trạng thái hồ sơ'],
            attitude: row['Tác phong & Thái độ'],
            leave: row['Nghỉ phép'],
            wishes: row['Tâm tư & Nguyện vọng'],
            phone: row['Số điện thoại'],
            role: row['Chức Vụ'] || 'Nhân viên',
            email: row['Họ và Tên'] ? `${row['Họ và Tên'].split(' ').pop()?.toLowerCase()}.${row['Mã nhân viên'].toLowerCase()}@solar24h.com` : '',
            scoreExpertise: parseFloat(row['Điểm Chuyên Môn']) || 5,
            scoreDiscipline: parseFloat(row['Điểm Kỷ Luật']) || 5,
            scoreAttitude: parseFloat(row['Điểm Thái Độ']) || 5,
            scoreSoftSkills: parseFloat(row['Kỹ Năng Mềm']) || 5,
            scoreKPI: parseFloat(row['Hiệu Suất']) || 5,
          }));
          setAllEmployees(parsed);
          setEmployees(parsed);
          setLoading(false);
        }
      });
    };
    fetchEmployees();
  }, []);

  // Fetch Timesheet Data based on selected month
  useEffect(() => {
    const fetchTimesheet = async () => {
      setLoading(true);
      const sheetName = `CHAM_CONG_THANG_${selectedMonth}`;
      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
      
      Papa.parse(url, {
        download: true,
        header: false,
        complete: (results) => {
          const lines = results.data as string[][];
          if (lines.length > 1) {
            const dataLines = lines.slice(1);
            let tsData: any = {};
            dataLines.forEach((parts) => {
              const id = parts[0];
              if (!id) return;
              
              const days = parts.slice(4, 35);
              const totalWorked = parts[35] || "0";
              const totalLeave = parts[36] || "0";
              const notes = parts[37] || "";

              tsData[id] = { id, days, totalWorked, totalLeave, notes };
            });
            setTimesheetData(tsData);
          } else {
            setTimesheetData({}); // Clear if no data
          }
          setLoading(false);
        },
        error: () => {
          setTimesheetData({});
          setLoading(false);
        }
      });
    };
    fetchTimesheet();
  }, [selectedMonth]);

  // Handle Search and Filter
  useEffect(() => {
    let filtered = [...allEmployees]; // Clone to avoid mutating state directly
    if (filterDept !== 'All') {
      filtered = filtered.filter(e => e.department && e.department.trim() === filterDept);
    }
    if (search.trim() !== '') {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(e => e.name.toLowerCase().includes(lowerSearch) || e.id.toLowerCase().includes(lowerSearch));
    }
    
    // Sort by department: Văn Phòng - Kỹ Thuật - Kinh Doanh
    const deptOrder = ['Văn Phòng', 'Kỹ Thuật', 'Kinh Doanh'];
    
    // Priorities for roles (higher up = smaller index)
    const roleOrder = [
      'Trưởng Phòng Nhân Sự', 'Trưởng Phòng Kinh Doanh', 'Kế Toán Trưởng', 'Đội Trưởng Kỹ Thuật', 
      'Đội Phó Kỹ Thuật', 'Kế Toán Tổng Hợp'
    ];

    filtered.sort((a, b) => {
      const deptA = a.department ? a.department.trim() : '';
      const deptB = b.department ? b.department.trim() : '';
      const roleA = a.role ? a.role.trim() : '';
      const roleB = b.role ? b.role.trim() : '';

      const deptRankA = deptOrder.indexOf(deptA) !== -1 ? deptOrder.indexOf(deptA) : 999;
      const deptRankB = deptOrder.indexOf(deptB) !== -1 ? deptOrder.indexOf(deptB) : 999;
      
      if (deptRankA !== deptRankB) {
        return deptRankA - deptRankB;
      }
      
      // Secondary sort by role within the same department
      const roleRankA = roleOrder.indexOf(roleA) !== -1 ? roleOrder.indexOf(roleA) : 999;
      const roleRankB = roleOrder.indexOf(roleB) !== -1 ? roleOrder.indexOf(roleB) : 999;
      
      return roleRankA - roleRankB;
    });
    
    setEmployees(filtered);
  }, [search, filterDept, allEmployees]);

  const getStatusClass = (status: string) => {
    if (status === 'Đủ ca') return 'status-du-ca';
    if (status === 'Nghỉ Phép') return 'status-nghi-phep';
    if (status === 'Vắng không phép' || status === 'Nghỉ Việc') return 'status-vang';
    if (status === 'Chủ Nhật') return 'status-chu-nhat';
    return 'status-empty';
  };

  const getEmpTimesheet = (id: string) => {
    return timesheetData[id] || null;
  };

  return (
    <div className="app-container">
      <div 
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'url(/assets/bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.15,
          zIndex: -1
        }}
      />

      <header className="header glass">
        <img src="/assets/logo.png" alt="Solar 24h Logo" className="header-logo" />
        <h1 className="header-title">Hành Chính Nhân Sự</h1>
      </header>

      <main className="main-content">
        
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${currentView === 'directory' ? 'active' : ''}`}
            onClick={() => setCurrentView('directory')}
          >
            Hồ sơ Nhân sự
          </button>
          <button 
            className={`nav-tab ${currentView === 'timesheet' ? 'active' : ''}`}
            onClick={() => setCurrentView('timesheet')}
          >
            Bảng Chấm Công
          </button>
        </div>

        {currentView === 'directory' ? (
          <>
            <div className="dashboard-grid">
              {/* Stat Cards Column */}
              <div className="dashboard-stats">
                <div className="stat-card glass">
                  <div className="stat-icon-wrapper">
                    <Users className="stat-icon" size={32} color="var(--primary-color)" />
                  </div>
                  <div className="stat-content">
                    <motion.div 
                      className="stat-value"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                    >
                      {allEmployees.length}
                    </motion.div>
                    <div className="stat-label">Tổng Nhân Sự</div>
                  </div>
                </div>
                <div className="stat-card glass">
                  <div className="stat-icon-wrapper">
                    <Building className="stat-icon" size={32} color="var(--primary-color)" />
                  </div>
                  <div className="stat-content">
                    <motion.div 
                      className="stat-value"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 100, delay: 0.3 }}
                    >
                      {departments.length - 1 > 0 ? departments.length - 1 : 0}
                    </motion.div>
                    <div className="stat-label">Phòng Ban</div>
                  </div>
                </div>
              </div>

              {/* Pie Chart Column */}
              <div className="stat-card glass chart-container">
                <div className="chart-title" style={{ textAlign: 'center', marginBottom: '1rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                  Tỷ lệ nhân sự theo phòng ban
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={20} 
                      iconType="circle" 
                      wrapperStyle={{ fontSize: '12px', opacity: 0.8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart Column */}
              <div className="stat-card glass chart-container">
                <div className="chart-title" style={{ textAlign: 'center', marginBottom: '1rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                  Tình trạng đi làm tháng {selectedMonth}
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      content={<CustomTooltip />}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={45}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="controls">
              <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={20} />
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Tìm kiếm nhân sự..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '3rem', width: '100%' }}
                />
              </div>
              <select 
                className="filter-select"
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept === 'All' ? 'Tất cả phòng ban' : dept}</option>
                ))}
              </select>
            </div>

            <motion.div 
              className="employee-grid"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
            >
              {loading && allEmployees.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
              ) : (
                <AnimatePresence>
                  {employees.map((emp) => (
                    <motion.div 
                      key={emp.id} 
                      className="employee-card glass" 
                      onClick={() => setSelectedEmp(emp)}
                      layout
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 300, damping: 24 }}
                      whileHover={{ translateY: -10, boxShadow: "0 15px 35px rgba(0, 0, 0, 0.5)", borderColor: "var(--primary-color)" }}
                    >
                      <div className="card-image-container">
                        <EmployeeImage id={emp.id} name={emp.name} className="employee-image" />
                        <div className="card-image-overlay"></div>
                      </div>
                      <div className="card-content">
                        <h3 className="employee-name">{emp.name}</h3>
                        <div className="employee-role" style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{emp.role}</div>
                        <div className="employee-dept">{emp.department}</div>
                        <div style={{ 
                          fontSize: '0.85rem', 
                          color: 'var(--text-secondary)',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                          {emp.phone || 'Chưa cập nhật'}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
            
            {employees.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                Không tìm thấy nhân sự nào.
              </div>
            )}
          </>
        ) : (
          <div className="timesheet-container animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ color: 'var(--primary-color)', margin: 0 }}>Bảng Chấm Công</h2>
              
              {/* Month Selector */}
              <select 
                className="filter-select"
                style={{ minWidth: '150px' }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="06">Tháng 06</option>
                <option value="07">Tháng 07</option>
                <option value="08">Tháng 08</option>
                <option value="09">Tháng 09</option>
                <option value="10">Tháng 10</option>
                <option value="11">Tháng 11</option>
                <option value="12">Tháng 12</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <span className="status-badge status-du-ca"></span> Đủ ca
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <span className="status-badge status-nghi-phep"></span> Nghỉ phép
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <span className="status-badge status-vang"></span> Vắng / Nghỉ việc
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <span className="status-badge status-chu-nhat"></span> Chủ nhật
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                Đang tải dữ liệu chấm công tháng {selectedMonth}...
              </div>
            ) : Object.keys(timesheetData).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                Chưa có dữ liệu chấm công cho tháng {selectedMonth}.
              </div>
            ) : (
              <table className="timesheet-table">
                <thead>
                  <tr>
                    <th className="emp-name" style={{ minWidth: '180px' }}>Họ và Tên</th>
                    <th style={{ minWidth: '80px' }}>Bộ phận</th>
                    {Array.from({ length: 31 }, (_, i) => (
                      <th key={i}>{i + 1}</th>
                    ))}
                    <th style={{ minWidth: '80px' }}>Tổng Công</th>
                    <th style={{ minWidth: '80px' }}>Nghỉ Phép</th>
                  </tr>
                </thead>
                <tbody>
                  {allEmployees.map(emp => {
                    const ts = getEmpTimesheet(emp.id);
                    return (
                      <tr key={emp.id}>
                        <td className="emp-name">{emp.name} <br/><span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)'}}>{emp.id}</span></td>
                        <td>{emp.department}</td>
                        {ts ? ts.days.map((status: string, idx: number) => (
                          <td key={idx}>
                            <span className={`status-badge ${getStatusClass(status)}`} title={status || 'Trống'}></span>
                          </td>
                        )) : Array.from({ length: 31 }, (_, i) => <td key={i}>-</td>)}
                        <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{ts ? ts.totalWorked : '-'}</td>
                        <td>{ts ? ts.totalLeave : '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {/* Modal */}
      <div className={`modal-overlay ${selectedEmp ? 'active' : ''}`} onClick={() => setSelectedEmp(null)}>
        <div className="modal-content glass" onClick={e => e.stopPropagation()}>
          <button className="close-btn" onClick={() => setSelectedEmp(null)}>&times;</button>
          
          {selectedEmp && (
            <div className="modal-body">
              <EmployeeImage id={selectedEmp.id} name={selectedEmp.name} className="modal-image" />
              <div className="modal-info">
                <div>
                  <h2 className="modal-name">{selectedEmp.name}</h2>
                  <div className="modal-dept" style={{ color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{selectedEmp.role}</div>
                  <div className="modal-dept">{selectedEmp.department}</div>
                </div>
                
                <div className="modal-details" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="contact-item">
                    <ChevronRight size={18} color="var(--primary-color)" />
                    <span><strong>Mã NV:</strong> {selectedEmp.id}</span>
                  </div>
                  <div className="contact-item">
                    <Calendar size={18} color="var(--primary-color)" />
                    <span><strong>Năm sinh:</strong> {selectedEmp.birthYear}</span>
                  </div>
                  <div className="contact-item">
                    <UserCheck size={18} color="var(--primary-color)" />
                    <span><strong>Ngày vào làm:</strong> {selectedEmp.startDate}</span>
                  </div>
                  <div className="contact-item">
                    <Phone size={18} color="var(--primary-color)" />
                    <span><strong>SĐT:</strong> {selectedEmp.phone || 'N/A'}</span>
                  </div>
                  <div className="contact-item">
                    <Mail size={18} color="var(--primary-color)" />
                    <span style={{ fontSize: '0.85rem' }}>{selectedEmp.email}</span>
                  </div>
                  <div className="contact-item">
                    <Heart size={18} color="var(--primary-color)" />
                    <span><strong>Thái độ:</strong> {selectedEmp.attitude}</span>
                  </div>
                </div>

                <div style={{
                  padding: '1rem', 
                  borderRadius: '0.5rem',
                  background: 'rgba(0,0,0,0.2)',
                  borderLeft: `4px solid ${selectedEmp.profileStatus === 'Đủ hồ sơ' ? '#4ade80' : '#f87171'}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Trạng thái hồ sơ: </strong>
                    <span style={{ color: selectedEmp.profileStatus === 'Đủ hồ sơ' ? '#4ade80' : '#f87171' }}>
                      {selectedEmp.profileStatus}
                    </span>
                  </div>
                  
                  {getEmpTimesheet(selectedEmp.id) && (
                     <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Clock size={16} color="var(--primary-color)" />
                          Công T{selectedMonth}: <strong style={{ color: '#22c55e' }}>{getEmpTimesheet(selectedEmp.id).totalWorked}</strong>
                        </div>
                     </div>
                  )}
                </div>
                
                {selectedEmp.wishes && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <strong>Tâm tư nguyện vọng:</strong> {selectedEmp.wishes}
                  </div>
                )}
                
                <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                  <button style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '1rem',
                    background: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseOver={(e) => (e.target as any).style.opacity = '0.9'}
                  onMouseOut={(e) => (e.target as any).style.opacity = '1'}
                  onClick={() => {
                    if (selectedEmp.phone) {
                      window.location.href = `tel:${selectedEmp.phone.replace(/\s+/g, '')}`;
                    } else {
                      alert('Nhân viên này chưa có số điện thoại!');
                    }
                  }}
                  >
                    <Phone size={18} />
                    Gọi Điện Thoại
                  </button>
                </div>
              </div>

              <div className="modal-radar">
                <div style={{ textAlign: 'center', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Star size={20} color="var(--primary-color)" />
                  <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Đánh Giá Năng Lực</h3>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart 
                    cx="50%" 
                    cy="50%" 
                    outerRadius="75%" 
                    data={[
                      { subject: 'Chuyên Môn', A: selectedEmp.scoreExpertise, fullMark: 10 },
                      { subject: 'Kỷ Luật', A: selectedEmp.scoreDiscipline, fullMark: 10 },
                      { subject: 'Thái Độ', A: selectedEmp.scoreAttitude, fullMark: 10 },
                      { subject: 'Kỹ Năng Mềm', A: selectedEmp.scoreSoftSkills, fullMark: 10 },
                      { subject: 'Hiệu Suất', A: selectedEmp.scoreKPI, fullMark: 10 }
                    ]}
                  >
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                    <Radar 
                      name={selectedEmp.name} 
                      dataKey="A" 
                      stroke="var(--primary-color)" 
                      fill="var(--primary-color)" 
                      fillOpacity={0.5} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', backdropFilter: 'blur(12px)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff' }}
                      itemStyle={{ color: 'var(--primary-color)', fontWeight: 'bold' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
