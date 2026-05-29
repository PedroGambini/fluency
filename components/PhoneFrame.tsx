'use client';

interface PhoneFrameProps {
  children: React.ReactNode;
}

export default function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div
        className="relative bg-white overflow-hidden"
        style={{
          width: '390px',
          height: '844px',
          borderRadius: '48px',
          border: '12px solid #1a1a1a',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        <div className="w-full h-full overflow-hidden relative">
          {children}
        </div>
      </div>
      <style jsx global>{`
        @media (max-width: 480px) {
          .phone-frame-wrapper {
            padding: 0 !important;
            background: white !important;
          }
          .phone-frame-wrapper > div {
            width: 100% !important;
            height: 100dvh !important;
            border-radius: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
