-- حذف الجدول القديم إن وجد
DROP TABLE IF EXISTS gatekeeper_sessions CASCADE;
DROP TABLE IF EXISTS gatekeeper_visitors CASCADE;

-- جدول الزوار
CREATE TABLE gatekeeper_visitors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    company VARCHAR(255),
    purpose TEXT,
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الجلسات (كل مرة يفتح الصفحة)
CREATE TABLE gatekeeper_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_name VARCHAR(255) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    shift_type VARCHAR(50),
    expected_end_time TIMESTAMP WITH TIME ZONE,
    gatekeeper_name VARCHAR(255),
    pin_code VARCHAR(3),
    handover_status VARCHAR(50) DEFAULT 'none',
    temp_pin VARCHAR(3),
    is_active BOOLEAN DEFAULT true,
    visitor_count INTEGER DEFAULT 0
);

-- جدول سجلات الزوار لكل جلسة
CREATE TABLE gatekeeper_visitor_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES gatekeeper_sessions(id) ON DELETE CASCADE,
    visitor_id UUID REFERENCES gatekeeper_visitors(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    check_out_time TIMESTAMP WITH TIME ZONE,
    badge_number VARCHAR(50),
    status VARCHAR(20) DEFAULT 'checked_in', -- checked_in, checked_out
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes للأداء
CREATE INDEX idx_sessions_active ON gatekeeper_sessions(is_active, started_at DESC);
CREATE INDEX idx_visitor_logs_session ON gatekeeper_visitor_logs(session_id, check_in_time DESC);
CREATE INDEX idx_visitors_phone ON gatekeeper_visitors(phone);
CREATE INDEX idx_visitors_created ON gatekeeper_visitors(created_at DESC);

-- RLS Policies
ALTER TABLE gatekeeper_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gatekeeper_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE gatekeeper_visitor_logs ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بالقراءة والكتابة (يمكنك تخصيصها حسب الحاجة)
CREATE POLICY "Allow all for sessions" ON gatekeeper_sessions FOR ALL USING (true);
CREATE POLICY "Allow all for visitors" ON gatekeeper_visitors FOR ALL USING (true);
CREATE POLICY "Allow all for logs" ON gatekeeper_visitor_logs FOR ALL USING (true);

-- Function لتحديث عدد الزوار تلقائياً
CREATE OR REPLACE FUNCTION update_session_visitor_count()
RETURNS TRIGGER AS $$
DECLARE
    target_session_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_session_id := OLD.session_id;
    ELSE
        target_session_id := NEW.session_id;
    END IF;

    UPDATE gatekeeper_sessions 
    SET visitor_count = (
        SELECT COUNT(*) 
        FROM gatekeeper_visitor_logs 
        WHERE session_id = target_session_id
    )
    WHERE id = target_session_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_visitor_count
AFTER INSERT OR DELETE ON gatekeeper_visitor_logs
FOR EACH ROW
EXECUTE FUNCTION update_session_visitor_count();

-- إضافة بيانات تجريبية (اختياري)
INSERT INTO gatekeeper_visitors (name, phone, company, purpose, notes) VALUES
('أحمد محمد', '0501234567', 'شركة النور', 'اجتماع عمل', 'زيارة قسم المبيعات'),
('فاطمة علي', '0507654321', 'مؤسسة الأمل', 'مقابلة شخصية', 'موعد الساعة 10 صباحاً');