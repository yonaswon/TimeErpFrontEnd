export const LoadingScreen = ({ label = 'Authenticating...' }: { label?: string }) => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white dark:bg-black">
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(244, 186, 74, 0.32) 0%, rgba(244, 186, 74, 0.08) 38%, transparent 68%)',
          animation: 'logoBacklight 2.6s ease-in-out infinite',
        }}
      />
      <div className="relative text-center">
        <div className="relative mx-auto h-24 max-w-[80vw]">
          <div className="relative hidden h-24 dark:block">
            <img src="/time-logo.png" alt="Time Creatives" className="h-24 w-auto object-contain" style={{ animation: 'logoLoadIn .8s ease-out both' }} />
            <div aria-hidden className="absolute inset-0" style={{
              background: 'linear-gradient(115deg, transparent 34%, rgba(244, 186, 74, .72) 50%, transparent 66%)',
              maskImage: 'url(/time-logo.png)', maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center',
              WebkitMaskImage: 'url(/time-logo.png)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center',
              animation: 'logoShine 2.6s ease-in-out infinite',
            }} />
          </div>
          <div className="relative h-24 dark:hidden">
            <img src="/time-logo-black.png" alt="Time Creatives" className="h-24 w-auto object-contain" style={{ animation: 'logoLoadIn .8s ease-out both' }} />
            <div aria-hidden className="absolute inset-0" style={{
              background: 'linear-gradient(115deg, transparent 34%, rgba(255, 255, 255, .68) 50%, transparent 66%)',
              maskImage: 'url(/time-logo-black.png)', maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center',
              WebkitMaskImage: 'url(/time-logo-black.png)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center',
              animation: 'logoShine 2.6s ease-in-out infinite',
            }} />
          </div>
        </div>
        <div className="mt-5 text-lg font-medium text-neutral-900 dark:text-neutral-100">{label}</div>
        <div className="mx-auto mt-4 h-[3px] w-36 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div className="h-full w-1/3 rounded-full bg-[#F4BA4A]" style={{ animation: 'logoProgress 1.4s ease-in-out infinite' }} />
        </div>
      </div>
      <style>{`
        @keyframes logoBacklight {
          0%, 100% { transform: translate(-50%, -50%) scale(.88); opacity: .45; }
          50% { transform: translate(-50%, -50%) scale(1.08); opacity: .8; }
        }
        @keyframes logoLoadIn {
          from { opacity: 0; transform: translateY(12px) scale(.96); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes logoShine {
          0% { transform: translateX(-100%); opacity: 0; }
          25% { opacity: .9; }
          60%, 100% { transform: translateX(100%); opacity: 0; }
        }
        @keyframes logoProgress {
          0% { transform: translateX(-110%); }
          100% { transform: translateX(320%); }
        }
      `}</style>
    </div>
  )
}
