import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar backdrop for mobile */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-gray-900 bg-opacity-75 transition-opacity lg:hidden",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />
      
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className={cn(
        "lg:pl-72 transition-all duration-300 ease-in-out",
        sidebarOpen ? "blur-sm lg:blur-0" : ""
      )}>
        <Header setSidebarOpen={setSidebarOpen} />
        
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Content container with subtle shadow and rounded corners */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              {/* Optional breadcrumb navigation */}
              <nav className="flex mb-6" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-2">
                  <li className="inline-flex items-center">
                    <a href="#" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600">
                      <svg className="w-3 h-3 mr-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
                      </svg>
                      Home
                    </a>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                      </svg>
                      <a href="#" className="ml-1 text-sm font-medium text-gray-500 hover:text-indigo-600 md:ml-2">Dashboard</a>
                    </div>
                  </li>
                </ol>
              </nav>

              {/* Page title */}
              <h1 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-200">
                Dashboard Overview
              </h1>

              {/* Main content */}
              {children}
            </div>

            {/* Footer */}
            <footer className="mt-8 text-center text-sm text-gray-500">
              <p>© {new Date().getFullYear()} HRMS Pro. All rights reserved.</p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout

// Helper function for conditional classes
function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}