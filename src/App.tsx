import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { Search, Mail, Phone, Users, Building, ChevronRight, Calendar, UserCheck, Heart, Clock, Star, X, Send } from 'lucide-react';
import Papa from 'papaparse';
import { GoogleGenAI, Type } from '@google/genai';
import { hrKnowledgeBase } from './hrKnowledge';
import './index.css';

const SPREADSHEET_ID = '1x9Hq0pM_Lmif8x-4CNX7YgVS-S9Y8uotii_00erLVA8';

// Helper component for loading local images with fallbacks
const EmployeeImage = ({ id, name, className, style, grayscale }: { id: string, name: string, className?: string, style?: any, grayscale?: boolean }) => {
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

  const finalStyle = {
    ...style,
    filter: grayscale ? 'grayscale(100%) opacity(0.8)' : 'none',
  };

  return <img src={src} alt={name} className={className} style={finalStyle} onError={handleError} />;
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

const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatus = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timeInMinutes = hours * 60 + minutes;

    const startWork = 7 * 60 + 30; // 07:30
    const startLunch = 11 * 60 + 30; // 11:30
    const endLunch = 13 * 60; // 13:00
    const endWork = 17 * 60; // 17:00

    if (timeInMinutes >= startLunch && timeInMinutes < endLunch) {
      return { text: 'Nghỉ trưa', color: '#facc15', icon: <Clock size={14} /> };
    } else if (timeInMinutes < startWork || timeInMinutes >= endWork) {
      return { text: 'Ngoài giờ hành chính', color: '#94a3b8', icon: <Clock size={14} /> };
    } else {
      return { text: 'Đang trong giờ làm', color: '#4ade80', icon: <Clock size={14} /> };
    }
  };

  const status = getStatus(time);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.5rem 1rem', borderRadius: '1rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)', fontFamily: 'monospace', lineHeight: 1.1 }}>
          {time.toLocaleTimeString('vi-VN')}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {time.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' })}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0,0,0,0.2)', padding: '0.4rem 0.8rem', borderRadius: '2rem', border: `1px solid ${status.color}40`, color: status.color, fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
        {status.icon}
        {status.text}
      </div>
    </div>
  );
};

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
  const [allMonthsData, setAllMonthsData] = useState<Record<string, any>>({});
  
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [currentView, setCurrentView] = useState('directory');
  const [enlargedQR, setEnlargedQR] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);
  const [expandedLeaveId, setExpandedLeaveId] = useState<string | null>(null);
  
  // Chatbot state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<{sender: 'user' | 'bot', text: string}[]>([
    { sender: 'bot', text: 'Dạ em chào anh/chị ạ! Em là trợ lý HR của Solar 24h đây ạ. Anh/chị cần em hỗ trợ tra cứu thông tin nhân sự hay chấm công của ai không ạ?' }
  ]);
  
  // Month selector state
  const currentMonthStr = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [loading, setLoading] = useState(true);

  const isEmployeeActive = (empId: string) => {
    if (Object.keys(timesheetData).length === 0) return true;
    return !!timesheetData[empId];
  };

  const departments = ['All', ...Array.from(new Set(allEmployees.filter(e => isEmployeeActive(e.id)).map(e => e.department ? e.department.trim() : ''))).filter(d => d !== '')];

  // Prepare Chart Data
  const COLORS = ['#38bdf8', '#f472b6', '#fbbf24', '#34d399', '#a78bfa'];
  const pieData = departments.filter(d => d !== 'All').map(dept => ({
    name: dept,
    value: allEmployees.filter(e => isEmployeeActive(e.id) && e.department && e.department.trim() === dept).length
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

  const getLeaveDetails = () => {
    const details: any[] = [];
    allEmployees.filter(e => isEmployeeActive(e.id)).forEach(emp => {
      const ts = timesheetData[emp.id];
      if (ts && ts.totalLeave && parseFloat(ts.totalLeave.toString().replace(',', '.')) > 0) {
        const leaveDates: number[] = [];
        ts.days.forEach((status: string, index: number) => {
          if (status && status.toLowerCase().includes('nghỉ phép')) {
            leaveDates.push(index + 1);
          }
        });
        
        details.push({
          id: emp.id,
          name: emp.name,
          department: emp.department,
          leaveDays: ts.totalLeave,
          leaveDates: leaveDates
        });
      }
    });
    return details.sort((a, b) => parseFloat(b.leaveDays.toString().replace(',', '.')) - parseFloat(a.leaveDays.toString().replace(',', '.')));
  };

  const getEmployeeTodayStatus = (empId: string) => {
    const ts = timesheetData[empId];
    if (!ts) return null;
    
    const currentDate = new Date();
    let dayIndex = currentDate.getDate() - 1;
    
    const currentMonthStr = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    if (selectedMonth !== currentMonthStr) {
      // Find the last recorded day with data if not viewing the current month
      let lastDay = ts.days.length - 1;
      while(lastDay >= 0 && (!ts.days[lastDay] || ts.days[lastDay].trim() === '')) {
        lastDay--;
      }
      dayIndex = lastDay >= 0 ? lastDay : 0;
    }
    
    if (dayIndex >= 0 && dayIndex < ts.days.length) {
       return ts.days[dayIndex];
    }
    return null;
  };

  const getStatusProps = (status: string | null) => {
    if (!status || status.trim() === '') return { color: '#94a3b8', label: 'Chưa cập nhật' };
    const s = status.toLowerCase();
    if (s.includes('đủ ca') || s.includes('nửa ngày')) return { color: '#22c55e', label: 'Đang làm việc' };
    if (s.includes('nghỉ phép')) return { color: '#facc15', label: 'Đang nghỉ phép' };
    if (s.includes('vắng') || s.includes('nghỉ việc')) return { color: '#ef4444', label: status };
    if (s.includes('chủ nhật')) return { color: '#475569', label: 'Nghỉ Chủ Nhật' };
    if (s.includes('lễ') || s.includes('tết')) return { color: '#a855f7', label: 'Nghỉ Lễ / Tết' };
    return { color: '#3b82f6', label: status };
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setIsTyping(true);

    let currentSangVerified = isSangVerified;
    if (!currentSangVerified && userMsg.includes('742698')) {
      setIsSangVerified(true);
      currentSangVerified = true;
    }

    try {
      const apiKeys = [
        import.meta.env.VITE_GEMINI_API_KEY_1,
        import.meta.env.VITE_GEMINI_API_KEY_2,
        import.meta.env.VITE_GEMINI_API_KEY_3
      ].filter(Boolean);

      if (apiKeys.length === 0) {
        setChatMessages(prev => [...prev, { sender: 'bot', text: 'Vui lòng cấu hình VITE_GEMINI_API_KEY_1, 2, 3 trong file .env.local để sử dụng AI.' }]);
        setIsTyping(false);
        return;
      }
      
      const systemInstruction = `Bạn là trợ lý HR (Hành chính nhân sự) thân thiện của công ty Solar 24h.
Ngày tháng hiện tại của hệ thống: ${new Date().toLocaleDateString('vi-VN')}

Dữ liệu nhân viên hiện tại:
${JSON.stringify(allEmployees.map(e => ({ id: e.id, name: e.name, department: e.department, role: e.role })))}

Dữ liệu tổng hợp số ngày công (totalWorked) và ngày nghỉ phép (totalLeave) của từng nhân viên theo từng tháng (từ tháng 06 đến tháng 12):
${JSON.stringify(allMonthsData)}

Dữ liệu chấm công chi tiết từng ngày của tháng đang chọn (Tháng ${selectedMonth}):
${JSON.stringify(timesheetData)}

${hrKnowledgeBase}

Chú ý đặc biệt về Bảo mật: 
${currentSangVerified ? `
Người dùng hiện tại ĐÃ ĐƯỢC XÁC MINH là anh Trần Hoàng Sang (Trưởng Phòng Nhân Sự).
Bạn hãy xưng hô phù hợp và CÓ QUYỀN sử dụng công cụ \`update_employee_leave\` để cập nhật dữ liệu khi anh ấy yêu cầu.
` : `
Người dùng hiện tại CHƯA ĐƯỢC XÁC MINH.
Nếu họ tự nhận là "anh Sang" hoặc yêu cầu cập nhật/chỉnh sửa dữ liệu, bạn TUYỆT ĐỐI TỪ CHỐI và yêu cầu họ cung cấp mã số bí mật (gồm 6 chữ số) để xác minh danh tính. TUYỆT ĐỐI KHÔNG BAO GIỜ được tiết lộ hay gợi ý mã số bí mật này ra, nếu họ báo quên mã thì từ chối hỗ trợ. KHÔNG có ngoại lệ.
`}

Lưu ý để phân tích dữ liệu:
- Để biết nhân viên có nghỉ việc hay không, BẮT BUỘC phải kiểm tra trường "notes" (Ghi chú) trong dữ liệu chấm công của tháng tương ứng. Nếu "notes" ghi "Nghỉ việc" hoặc "Đã nghỉ việc", nghĩa là nhân viên đó đã nghỉ việc.
- Một nhân viên có mặt trong danh sách nhân sự hiện tại nhưng không có tên trong bảng chấm công của tháng hiện tại nghĩa là họ đã nghỉ việc từ các tháng trước.

Hãy trả lời ngắn gọn, thân thiện, và dùng tiếng Việt. Khi được hỏi về thông tin một nhân viên (vd: hỏi theo tên hoặc mã) hoặc dữ liệu chấm công của ngày/tháng bất kỳ, hãy đối chiếu với "Ngày tháng hiện tại" và tìm trong dữ liệu để trả lời đầy đủ thông tin. Nếu dữ liệu của tháng nào đó trống, hãy báo là chưa có dữ liệu.`;

      const historyContents = chatMessages.slice(1).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
      historyContents.push({ role: 'user', parts: [{ text: userMsg }] });

      let success = false;
      for (let i = 0; i < apiKeys.length; i++) {
        try {
          const ai = new GoogleGenAI({ apiKey: apiKeys[i] });
          const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: historyContents as any,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.7,
              tools: [{
                functionDeclarations: [
                  {
                    name: 'update_employee_leave',
                    description: 'Cập nhật trạng thái ngày làm việc của nhân viên thành Nghỉ Phép. Chỉ được gọi khi đã xác minh người dùng là anh Sang.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        employeeId: { type: Type.STRING, description: 'Mã nhân viên (ví dụ: VP-01)' },
                        dayIndex: { type: Type.INTEGER, description: 'Ngày trong tháng cần cập nhật (ví dụ: 5)' },
                        month: { type: Type.STRING, description: 'Tháng cần cập nhật, định dạng 2 chữ số (ví dụ: "08", "09"). Cần dựa vào câu hỏi của người dùng hoặc tháng hiện tại.' }
                      },
                      required: ['employeeId', 'dayIndex', 'month']
                    }
                  }
                ]
              }]
            }
          });

          if (response.functionCalls && response.functionCalls.length > 0) {
            const call = response.functionCalls[0];
            if (call.name === 'update_employee_leave') {
              const { employeeId, dayIndex, month } = call.args as any;
              
              // Update local state ONLY if it's the currently selected month
              if (month === selectedMonth) {
                setTimesheetData((prev: any) => {
                  const newTs = { ...prev };
                  if (newTs[employeeId]) {
                     const newDays = [...newTs[employeeId].days];
                     newDays[dayIndex - 1] = 'Nghỉ Phép'; // days array is 0-indexed for day 1
                     newTs[employeeId] = { ...newTs[employeeId], days: newDays };
                  }
                  return newTs;
                });
              }

              // Send to Google Sheets backend
              const scriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
              if (scriptUrl) {
                fetch(scriptUrl, {
                  method: 'POST',
                  mode: 'no-cors',
                  headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                  },
                  body: JSON.stringify({
                    month: month,
                    employeeId,
                    dayIndex,
                    status: 'Nghỉ Phép'
                  })
                }).catch(err => console.error('Error saving to Sheets:', err));
              }

              setChatMessages(prev => [...prev, { sender: 'bot', text: `Dạ em đã cập nhật thành công ngày ${dayIndex} của tháng ${month} cho nhân viên mã ${employeeId} thành Nghỉ phép trên hệ thống rồi ạ!` }]);
            }
          } else {
            const text = response.text || "Xin lỗi, tôi không thể trả lời lúc này.";
            setChatMessages(prev => [...prev, { sender: 'bot', text }]);
          }
          
          success = true;
          break; // Stop loop on success
        } catch (error) {
          console.warn(`API Key ${i + 1} failed:`, error);
          // Automatically continues to next key in loop
        }
      }

      if (!success) {
        setChatMessages(prev => [...prev, { sender: 'bot', text: 'Tất cả API Key hiện tại đều đã hết hạn mức hoặc gặp lỗi. Vui lòng thử lại sau.' }]);
      }
    } catch (error) {
      console.error("Unexpected Error:", error);
      setChatMessages(prev => [...prev, { sender: 'bot', text: 'Đã xảy ra lỗi không xác định. Vui lòng kiểm tra lại.' }]);
    } finally {
      setIsTyping(false);
    }
  };

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
            bankName: row['Ngân Hàng'] ? row['Ngân Hàng'].replace(/[^a-zA-Z0-9\s]/g, '').trim() : '',
            bankAccount: row['Số Tài Khoản'] ? row['Số Tài Khoản'].replace(/[^0-9a-zA-Z]/g, '').trim() : '',
          }));
          setAllEmployees(parsed);
          setEmployees(parsed);
          setLoading(false);
        }
      });
    };
    fetchEmployees();
  }, []);

  // Fetch all months data for AI in the background
  useEffect(() => {
    const monthsToFetch = ['06', '07', '08', '09', '10', '11', '12'];
    const fetchAll = async () => {
      const allData: Record<string, any> = {};
      
      const promises = monthsToFetch.map(month => {
        return new Promise<void>((resolve) => {
          const sheetName = `CHAM_CONG_THANG_${month}`;
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
                  const totalWorked = parts[35] || "0";
                  const totalLeave = parts[36] || "0";
                  const notes = parts[37] || "";
                  tsData[id] = { totalWorked, totalLeave, notes };
                });
                allData[month] = tsData;
              }
              resolve();
            },
            error: () => resolve()
          });
        });
      });

      await Promise.all(promises);
      setAllMonthsData(allData);
    };
    
    fetchAll();
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

    // Only include employees who are in the current month's timesheet (if data is loaded)
    if (Object.keys(timesheetData).length > 0) {
      filtered = filtered.filter(e => timesheetData[e.id] && isEmployeeActive(e.id));
    }

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
  }, [search, filterDept, allEmployees, timesheetData]);

  const getStatusClass = (status: string) => {
    if (status === 'Đủ ca') return 'status-du-ca';
    if (status === 'Nghỉ Phép') return 'status-nghi-phep';
    if (status === 'Vắng không phép' || status === 'Nghỉ Việc') return 'status-vang';
    if (status === 'Chủ Nhật') return 'status-chu-nhat';
    if (status === 'Nghỉ Lễ / Tết' || status.includes('Nghỉ Lễ') || status.includes('Tết')) return 'status-nghi-le';
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="/assets/logo.png" alt="Solar 24h Logo" className="header-logo" />
          <h1 className="header-title">Hành Chính Nhân Sự</h1>
        </div>
        <LiveClock />
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
                      {allEmployees.filter(e => isEmployeeActive(e.id)).length}
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
                      {pieData.map((_, index) => (
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
                    <Bar 
                      dataKey="value" 
                      radius={[6, 6, 0, 0]} 
                      barSize={45}
                      cursor="pointer"
                      onClick={(data) => {
                        if (data.name === 'Nghỉ phép (Ngày)') {
                          setShowLeaveModal(true);
                        }
                      }}
                    >
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
                        <EmployeeImage 
                          id={emp.id} 
                          name={emp.name} 
                          className="employee-image" 
                          grayscale={getEmployeeTodayStatus(emp.id)?.toLowerCase().includes('nghỉ việc')} 
                        />
                        <div className="card-image-overlay"></div>
                        
                        {(() => {
                          const rawStatus = getEmployeeTodayStatus(emp.id);
                          const { color, label } = getStatusProps(rawStatus);
                          return (
                            <div 
                              className="status-dot-wrapper"
                              title={label}
                              style={{ backgroundColor: color }}
                            />
                          );
                        })()}
                      </div>
                      <div className="card-content">
                        <h3 className="employee-name">{emp.name}</h3>
                        <div className="employee-role" style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{emp.role}</div>
                        
                        <div className="employee-badges">
                          <div className="employee-dept">{emp.department}</div>
                          {(() => {
                            const rawStatus = getEmployeeTodayStatus(emp.id);
                            const { color, label } = getStatusProps(rawStatus);
                            return (
                              <div className="employee-status" style={{ color: color, borderColor: `${color}40` }}>
                                <span style={{ backgroundColor: color }}></span>
                                {label}
                              </div>
                            );
                          })()}
                        </div>

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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <span className="status-badge status-nghi-le"></span> Nghỉ Lễ / Tết
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
                  {employees.map(emp => {
                    const ts = getEmpTimesheet(emp.id);
                    if (!ts) return null;
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
                
                {selectedEmp.bankName && selectedEmp.bankAccount && (
                  <div style={{
                    marginTop: '1rem',
                    marginBottom: '1rem',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div 
                      style={{ 
                        width: '100px', 
                        height: '100px', 
                        background: 'white', 
                        borderRadius: '8px', 
                        padding: '4px',
                        flexShrink: 0,
                        cursor: 'pointer'
                      }}
                      onClick={() => setEnlargedQR(`https://img.vietqr.io/image/${selectedEmp.bankName.replace(/\s+/g, '')}-${selectedEmp.bankAccount}-compact2.png`)}
                    >
                      <img 
                        src={`https://img.vietqr.io/image/${selectedEmp.bankName.replace(/\s+/g, '')}-${selectedEmp.bankAccount}-compact2.png`} 
                        alt="VietQR" 
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <div>
                      <div style={{ color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.2rem' }}>Thưởng Nóng 🎁</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{selectedEmp.bankName}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)', letterSpacing: '1px' }}>{selectedEmp.bankAccount}</div>
                    </div>
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

      {/* Enlarged QR Modal */}
      <AnimatePresence>
        {enlargedQR && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              zIndex: 100000000000,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backdropFilter: 'blur(8px)',
              padding: '2rem'
            }}
            onClick={() => setEnlargedQR(null)}
          >
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: '16px',
                maxWidth: '90vw',
                maxHeight: '90vh'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={enlargedQR} 
                alt="Enlarged VietQR" 
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }}
              />
              <div style={{ textAlign: 'center', marginTop: '16px', color: '#1e293b', fontWeight: 'bold', fontSize: '1.2rem' }}>
                Thưởng Nóng cho {selectedEmp?.name} 🎁
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave Details Modal */}
      <AnimatePresence>
        {showLeaveModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              zIndex: 100000000000,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backdropFilter: 'blur(4px)',
              padding: '1rem'
            }}
            onClick={() => setShowLeaveModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: 'rgba(30, 41, 59, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '24px',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '400px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: '#facc15', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={20} />
                  Danh sách Nghỉ phép
                </h3>
                <button 
                  onClick={() => setShowLeaveModal(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}
                >
                  &times;
                </button>
              </div>
              
              <div style={{ overflowY: 'auto', paddingRight: '8px', flex: 1, margin: '-8px' }}>
                <div style={{ padding: '8px' }}>
                  {getLeaveDetails().length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {getLeaveDetails().map(emp => (
                        <div key={emp.id} style={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '12px',
                          borderRadius: '8px'
                        }}>
                          <div 
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              cursor: 'pointer'
                            }}
                            onClick={() => setExpandedLeaveId(expandedLeaveId === emp.id ? null : emp.id)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#334155' }}>
                                <EmployeeImage id={emp.id} name={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{emp.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{emp.department}</div>
                              </div>
                            </div>
                            <div style={{ 
                              background: 'rgba(250, 204, 21, 0.2)', 
                              color: '#facc15', 
                              padding: '4px 10px', 
                              borderRadius: '20px', 
                              fontWeight: 'bold',
                              fontSize: '0.9rem',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {emp.leaveDays} ngày
                              <ChevronRight size={16} style={{ transform: expandedLeaveId === emp.id ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                            </div>
                          </div>
                          
                          <AnimatePresence>
                            {expandedLeaveId === emp.id && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 4 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div style={{ 
                                  padding: '10px 12px', 
                                  background: 'rgba(0,0,0,0.2)', 
                                  borderRadius: '6px',
                                  fontSize: '0.85rem',
                                  color: 'var(--text-secondary)',
                                  borderLeft: '2px solid #facc15'
                                }}>
                                  {emp.leaveDates && emp.leaveDates.length > 0 ? (
                                    <>Đã nghỉ vào các ngày: <strong style={{ color: 'var(--text-primary)' }}>{emp.leaveDates.map((d: number) => `${d}/${selectedMonth}`).join(', ')}</strong></>
                                  ) : (
                                    <>Chưa có chi tiết ngày nghỉ cụ thể trong bảng chấm công.</>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>
                      Không có nhân sự nào nghỉ phép trong tháng này.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chatbot Assistant UI */}
      <div className="chatbot-container">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              className="chatbot-window"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="chat-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/SolarGirlHR.jpeg" alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                  <h3>Trợ Lý HR</h3>
                </div>
                <button className="chat-close" onClick={() => setIsChatOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              
              <div className="chat-messages">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`chat-message ${msg.sender}`}>
                    {msg.text.split('\n').map((line, idx) => (
                      <div key={idx}>{line}</div>
                    ))}
                  </div>
                ))}
                {isTyping && (
                  <div className="chat-message bot" style={{ opacity: 0.7 }}>
                    Đang gõ...
                  </div>
                )}
              </div>

              <div className="chat-input-container">
                <input 
                  type="text" 
                  className="chat-input"
                  placeholder="Hỏi về nhân sự, chấm công..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleChatSend()}
                />
                <button className="chat-send" onClick={handleChatSend}>
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          className="chatbot-fab" 
          onClick={() => setIsChatOpen(!isChatOpen)}
          title="Trợ Lý HR"
          style={isChatOpen ? {} : { padding: 0, overflow: 'hidden', border: '2px solid var(--primary-color)' }}
        >
          {isChatOpen ? <X size={24} /> : <img src="/SolarGirlHR.jpeg" alt="HR Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </button>
      </div>
    </div>
  );
}

export default App;
