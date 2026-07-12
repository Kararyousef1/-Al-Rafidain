import React from 'react';

type IconProps = { size?: number };

/**
 * أيقونات تواصل اجتماعي مرسومة يدوياً (SVG) بدل الاعتماد على مكتبة خارجية جديدة —
 * lucide-react لا يحتوي أيقونات علامات تجارية، لذا نبقي المشروع بلا تبعيات إضافية.
 */
export const FacebookIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M13.5 21v-7.5h2.5l.4-3H13.5V8.4c0-.87.24-1.46 1.5-1.46h1.6V4.35C16.3 4.24 15.3 4.15 14.16 4.15c-2.4 0-4.04 1.46-4.04 4.15V10.5H7.6v3h2.52V21h3.38Z" />
  </svg>
);

export const InstagramIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="3.7" />
    <circle cx="17.1" cy="6.9" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const LinkedInIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6.94 8.5H4.06V20h2.88V8.5ZM5.5 4c-.97 0-1.75.79-1.75 1.75S4.53 7.5 5.5 7.5s1.75-.79 1.75-1.75S6.47 4 5.5 4ZM20 20v-6.4c0-3.06-1.63-4.48-3.8-4.48-1.75 0-2.54.96-2.98 1.64V8.5H10.34C10.38 9.3 10.34 20 10.34 20h2.88v-6.42c0-.34.03-.68.13-.93.27-.68.9-1.38 1.95-1.38 1.37 0 1.92 1.05 1.92 2.58V20H20Z" />
  </svg>
);

export const XIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.9 3H21l-6.55 7.49L22.2 21h-6.06l-4.75-6.2L5.94 21H3.82l7.02-8.02L3 3h6.2l4.3 5.68L18.9 3Zm-1.06 16.17h1.14L7.9 4.76H6.68l11.16 14.41Z" />
  </svg>
);

export const WhatsAppIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.02 3c-4.97 0-9 4.03-9 9 0 1.6.42 3.1 1.15 4.4L3 21l4.72-1.15A8.96 8.96 0 0 0 12.02 21c4.97 0 9-4.03 9-9s-4.03-9-9-9Zm0 16.2c-1.36 0-2.63-.37-3.72-1.02l-.27-.16-2.8.68.7-2.73-.18-.28A7.18 7.18 0 0 1 4.82 12c0-3.98 3.24-7.2 7.2-7.2s7.2 3.22 7.2 7.2-3.24 7.2-7.2 7.2Zm3.96-5.4c-.22-.11-1.28-.63-1.48-.7-.2-.07-.34-.11-.49.11-.14.22-.56.7-.69.84-.13.14-.25.16-.47.05-.22-.11-.94-.35-1.79-1.11-.66-.59-1.11-1.32-1.24-1.54-.13-.22-.01-.34.1-.45.1-.1.22-.25.33-.38.11-.13.14-.22.22-.36.07-.14.04-.27-.02-.38-.06-.11-.49-1.19-.68-1.63-.18-.43-.36-.37-.49-.38h-.42c-.14 0-.36.05-.55.27-.19.22-.72.7-.72 1.72s.74 2 .84 2.14c.1.14 1.45 2.22 3.52 3.11.49.21.88.34 1.18.43.5.16.95.14 1.3.08.4-.06 1.28-.52 1.46-1.03.18-.5.18-.94.13-1.03-.05-.09-.2-.14-.42-.25Z" />
  </svg>
);
