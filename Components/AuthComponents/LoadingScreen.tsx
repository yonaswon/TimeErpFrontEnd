export const LoadingScreen = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 transition-colors duration-300">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
        <div className="text-xl text-gray-900 dark:text-gray-100">Authenticating...</div>
      </div>
    </div>
  )
}