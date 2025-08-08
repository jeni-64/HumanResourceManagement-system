import { useQuery } from 'react-query'
import { 
  UsersIcon, 
  BuildingOfficeIcon, 
  ClockIcon, 
  CalendarDaysIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon // FIXED: Removed 'Icon' suffix
} from '@heroicons/react/24/outline'
import { reportsAPI } from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { useAuth } from '../../contexts/AuthContext'

const Dashboard = () => {
  const { user } = useAuth()

  const { data: employeeStats, isLoading } = useQuery(
    'employee-stats',
    () => reportsAPI.getEmployeeStats(),
    {
      enabled: user?.role !== 'EMPLOYEE',
    }
  )

  const stats = employeeStats?.data?.stats

  const dashboardCards = [
    {
      title: 'Total Employees',
      value: stats?.overview?.totalEmployees || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Active Employees',
      value: stats?.overview?.activeEmployees || 0,
      icon: ArrowTrendingUpIcon, // FIXED
      color: 'bg-green-500',
      change: '+2%',
      changeType: 'increase'
    },
    {
      title: 'Departments',
      value: stats?.byDepartment?.length || 0,
      icon: BuildingOfficeIcon,
      color: 'bg-purple-500',
      change: '0%',
      changeType: 'neutral'
    },
    {
      title: 'On Leave',
      value: stats?.overview?.onLeaveEmployees || 0,
      icon: CalendarDaysIcon,
      color: 'bg-yellow-500',
      change: '-5%',
      changeType: 'decrease'
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {user?.employee?.firstName || user?.email}
        </p>
      </div>

      {/* Stats Grid */}
      {user?.role !== 'EMPLOYEE' && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardCards.map((card) => (
            <div key={card.title} className="card">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${card.color} p-3 rounded-lg`}>
                      <card.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {card.title}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {card.value}
                        </div>
                        <div
                          className={`ml-2 flex items-baseline text-sm font-semibold ${
                            card.changeType === 'increase'
                              ? 'text-green-600'
                              : card.changeType === 'decrease'
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {card.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="card-content">
            <div className="space-y-3">
              <button className="btn-primary w-full">
                <ClockIcon className="h-5 w-5 mr-2" />
                Clock In/Out
              </button>
              <button className="btn-outline w-full">
                <CalendarDaysIcon className="h-5 w-5 mr-2" />
                Request Leave
              </button>
              {user?.role !== 'EMPLOYEE' && (
                <button className="btn-outline w-full">
                  <UsersIcon className="h-5 w-5 mr-2" />
                  Add Employee
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="card-content">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <ClockIcon className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">Clocked in at 9:00 AM</p>
                  <p className="text-xs text-gray-500">Today</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <CalendarDaysIcon className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">Leave request approved</p>
                  <p className="text-xs text-gray-500">Yesterday</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Department Overview */}
      {user?.role !== 'EMPLOYEE' && stats?.byDepartment && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Department Overview</h3>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stats.byDepartment.map((dept) => (
                <div key={dept.departmentName} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {dept.departmentName}
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {dept.count}
                      </p>
                    </div>
                    <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
