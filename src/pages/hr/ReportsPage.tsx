import { useState } from 'react';
import { Download, FileText, Calendar, CheckCircle } from 'lucide-react';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useUIStore } from '../../store';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { fetchAllIncidents, fetchAllWellnessEntries, fetchAllTimeLogs } from '../../sdk/reports';

const reports = [
  { id: '1', title: 'تقرير المشاكل الشهري - ديسمبر 2024', type: 'problems', date: '2024-12-01', size: '2.4 MB', format: 'PDF' },
  { id: '2', title: 'تقرير الصحة النفسية الربعي', type: 'wellness', date: '2024-11-01', size: '1.8 MB', format: 'Excel' },
  { id: '3', title: 'تقرير رضا الموظفين السنوي 2024', type: 'satisfaction', date: '2024-10-01', size: '5.2 MB', format: 'PDF' },
  { id: '4', title: 'تقرير الأداء - الربع الثالث', type: 'performance', date: '2024-09-01', size: '3.1 MB', format: 'Excel' },
  { id: '5', title: 'تقرير التحليل الذكي للمشاعر', type: 'sentiment', date: '2024-08-01', size: '1.2 MB', format: 'PDF' },
];

const typeColors: Record<string, string> = {
  problems: 'bg-red-50 text-red-600',
  wellness: 'bg-rose-50 text-rose-600',
  satisfaction: 'bg-indigo-50 text-indigo-600',
  performance: 'bg-emerald-50 text-emerald-600',
  sentiment: 'bg-purple-50 text-purple-600',
};

export default function ReportsPage() {
  const { addToast, setActiveView } = useUIStore();
  const [generating, setGenerating] = useState<string | null>(null);

  // دالة تصدير الإكسل الاحترافية (نفس المستخدمة في البوابة)
  const exportToStyledExcel = (filename: string, headers: string[], data: any[][], title: string) => {
    const escapeXml = (unsafe: any): string => {
      if (unsafe === null || unsafe === undefined) return '';
      return String(unsafe).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    };

    const getColumnWidth = (header: string): number => {
      if (header === '#') return 40;
      if (header.includes('تاريخ') || header.includes('وقت')) return 160;
      if (header.includes('الاسم') || header.includes('الموظف')) return 180;
      if (header.includes('ملاحظات') || header.includes('وصف')) return 250;
      return 120;
    };

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center" ss:Horizontal="Right" ss:ReadingOrder="RightToLeft"/>
      <Font ss:FontName="Tahoma" ss:Size="10" ss:Color="#1E293B"/>
    </Style>
    <Style ss:ID="Header">
      <Alignment ss:Vertical="Center" ss:Horizontal="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#4F46E5"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/>
      </Borders>
      <Font ss:FontName="Tahoma" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
      <Interior ss:Color="#1E1B4B" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="RowEven">
      <Alignment ss:Vertical="Center" ss:Horizontal="Right" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
      </Borders>
      <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="RowOdd">
      <Alignment ss:Vertical="Center" ss:Horizontal="Right" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
      </Borders>
      <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${escapeXml(title)}">
    <Table ss:DefaultRowHeight="25">
      ${headers.map(h => `<Column ss:Width="${getColumnWidth(h)}"/>`).join('\n      ')}
      <Row ss:Height="30">
        ${headers.map(h => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join('\n        ')}
      </Row>
      ${data.map((row, i) => {
        const style = i % 2 === 0 ? 'RowEven' : 'RowOdd';
        return `<Row ss:AutoFitHeight="1">
          ${row.map(cell => `<Cell ss:StyleID="${style}"><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`).join('\n          ')}
        </Row>`;
      }).join('\n      ')}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <DisplayRightToLeft/>
      <RightToLeft>1</RightToLeft>
      <FreezePanes/>
      <FrozenNoSplit/>
      <SplitHorizontal>1</SplitHorizontal>
      <TopRowBottomPane>1</TopRowBottomPane>
      <ActivePane>2</ActivePane>
    </WorksheetOptions>
  </Worksheet>
</Workbook>`;

    const blob = new Blob(['\uFEFF' + xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.xls`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 100);
  };

  const handleGenerate = async (type: string) => {
    if (type === 'movement') {
      setActiveView('hr-movement-analysis');
      return;
    }
    
    setGenerating(type);
    
    try {
        if (type === 'monthly') {
        // تقرير المشاكل الشامل
        const incData = await fetchAllIncidents();
        
        const headers = ['#', 'عنوان المشكلة', 'الموظف', 'القسم', 'الفئة', 'الأولوية', 'الحالة', 'تاريخ الرفع'];
        const rows = (incData || []).map((inc, i) => [
          String(i + 1),
          inc.title,
          inc.is_anonymous ? 'مجهول' : (inc.reporter?.full_name || 'غير معروف'),
          inc.reporter?.department || '-',
          inc.category,
          inc.severity,
          inc.status,
          new Date(inc.created_at).toLocaleString('en-US')
        ]);
        exportToStyledExcel(`تقرير_المشاكل_${format(new Date(), 'yyyy-MM-dd')}`, headers, rows, 'المشاكل المرفوعة');
        addToast('تم تصدير تقرير المشاكل بنجاح', 'success');
      } 
      else if (type === 'wellness') {
        // تقرير الصحة النفسية
        const wellData = await fetchAllWellnessEntries();

        const headers = ['#', 'الموظف', 'القسم', 'التاريخ', 'مؤشر الصحة', 'التوتر', 'الطاقة', 'ملاحظات'];
        const rows = (wellData || []).map((w, i) => [
          String(i + 1),
          w.profiles?.full_name || 'غير معروف',
          w.profiles?.department || '-',
          w.date,
          `${w.score}%`,
          `${w.stress}%`,
          `${w.energy}%`,
          w.notes || ''
        ]);
        exportToStyledExcel(`تقرير_الصحة_النفسية_${format(new Date(), 'yyyy-MM-dd')}`, headers, rows, 'الصحة النفسية');
        addToast('تم تصدير تقرير الصحة بنجاح', 'success');
      }
      else if (type === 'attendance') {
        // تقرير الحضور والانصراف
        const attData = await fetchAllTimeLogs();

        const headers = ['#', 'الموظف', 'القسم', 'نوع السجل', 'التاريخ والوقت', 'ملاحظات الكشك'];
        const rows = (attData || []).map((a, i) => [
          String(i + 1),
          a.profiles?.full_name || 'غير معروف',
          a.profiles?.department || '-',
          a.log_type === 'check_in' ? 'دخول' : a.log_type === 'check_out' ? 'خروج' : a.log_type === 'break_start' ? 'بدء استراحة' : 'نهاية استراحة',
          new Date(a.timestamp).toLocaleString('en-US'),
          a.notes || ''
        ]);
        exportToStyledExcel(`تقرير_الحضور_${format(new Date(), 'yyyy-MM-dd')}`, headers, rows, 'سجل الحضور');
        addToast('تم تصدير تقرير الحضور بنجاح', 'success');
      }
      else {
        // التقارير الأخرى التي لم تُبرمج جداولها بالكامل بعد
        await new Promise(r => setTimeout(r, 1500));
        addToast(`عذراً، هذا التقرير قيد التطوير وسيتاح قريباً.`, 'info');
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      addToast(`فشل في توليد التقرير: ${error.message}`, 'error');
    } finally {
    setGenerating(null);
    }
  };

  const handleDownload = (title: string) => {
    addToast(`جاري تحميل: ${title}`, 'info');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800">📊 التقارير والإحصاءات</h2>
        <p className="text-sm text-slate-500">توليد وتحميل التقارير الإدارية</p>
      </div>

      {/* Generate */}
      <Card>
        <CardHeader>
          <CardTitle>🆕 توليد تقرير جديد</CardTitle>
        </CardHeader>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { id: 'monthly', label: 'تقرير شهري شامل', icon: '📅', desc: 'جميع المشاكل والإحصاءات لهذا الشهر' },
            { id: 'wellness', label: 'تقرير الصحة النفسية', icon: '❤️', desc: 'مؤشرات الصحة والمزاج للموظفين' },
            { id: 'sentiment', label: 'تقرير تحليل المشاعر', icon: '🧠', desc: 'تحليل AI لمشاعر الموظفين' },
            { id: 'performance', label: 'تقرير الأداء', icon: '📈', desc: 'مؤشرات الأداء والإنتاجية' },
            { id: 'attendance', label: 'تقرير الحضور والانصراف', icon: '⏱️', desc: 'تحليل دقيق لأوقات الحضور، التأخير، وساعات العمل' },
            { id: 'movement', label: 'تقرير حركة الموظفين', icon: '🏃', desc: 'تحليل أوقات الخروج والعودة والوجهات' },
          ].map(r => (
            <div key={r.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-2xl">{r.icon}</span>
              <div className="flex-1">
                <p className="font-bold text-slate-800 text-sm">{r.label}</p>
                <p className="text-xs text-slate-500">{r.desc}</p>
              </div>
              <Button
                size="xs"
                loading={generating === r.id}
                onClick={() => handleGenerate(r.id)}
                icon={generating === r.id ? undefined : <Download size={12} />}
                iconPosition="left"
              >
                {generating === r.id ? 'جاري...' : (r.id === 'movement' ? 'فتح' : 'توليد')}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Existing reports */}
      <Card>
        <CardHeader>
          <CardTitle>📁 التقارير السابقة</CardTitle>
          <Badge variant="neutral">{reports.length} تقرير</Badge>
        </CardHeader>
        <div className="space-y-3">
          {reports.map(report => (
            <div key={report.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColors[report.type]}`}>
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate">{report.title}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Calendar size={11} /> {report.date}</span>
                  <span>{report.size}</span>
                  <Badge variant={report.format === 'PDF' ? 'danger' : 'success'} size="sm">{report.format}</Badge>
                </div>
              </div>
              <Button
                size="xs"
                variant="secondary"
                icon={<Download size={12} />}
                iconPosition="left"
                onClick={() => handleDownload(report.title)}
              >
                تحميل
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
