import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { employeeAPI } from '../../services/api'
import Badge from '../../components/UI/Badge'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { useAuth } from '../../contexts/AuthContext'
import { format } from 'date-fns'

const EmployeeDetail = () => {
  const { id } = useParams()
  const { hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  const { data, isLoading, error } = useQuery(
    ['employee', id],
    () => employeeAPI.getById(id),
    {
      enabled: !!id
    }
  )

  const employee = data?.data

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'attendance', name: 'Attendance' },
    { id: 'leave', name: 'Leave History' },
    { id: 'documents', name: 'Documents' },
  ]

  const getStatusBadge = (status) => {
    const variants = {
      ACTIVE: 'success',
      INACTIVE: 'warning',
      TERMINATED: 'error',
      ON_LEAVE: 'info',
      PROBATION: 'warning'
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading employee details</p>
        <Link to="/employees" className="btn-primary mt-4">
          Back to Employees
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/employees" className="btn-outline">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="text-sm text-gray-500">Employee ID: {employee.employeeId}</p>
          </div>
        </div>
        {hasPermission(['ADMIN', 'HR']) && (
          <button className="btn-primary">
            <PencilIcon className="h-5 w-5 mr-2" />
            Edit Employee
          </button>
        )}
      </div>

      {/* Employee Profile Card */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              <div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-2xl font-medium text-gray-700">
                  {employee.firstName[0]}{employee.lastName[0]}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Contact Information</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center text-sm text-gray-900">
                      <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {employee.email}
                    </div>
                    {employee.phone && (
                      <div className="flex items-center text-sm text-gray-900">
                        <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {employee.phone}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Employment Details</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center text-sm text-gray-900">
                      <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {employee.department?.name || 'N/A'}
                    </div>
                    <div className="flex items-center text-sm text-gray-900">
                      <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {employee.position?.title || 'N/A'}
                    </div>
                    <div className="flex items-center text-sm text-gray-900">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                      Hired {format(new Date(employee.hireDate), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <div className="mt-2 space-y-2">
                    <div>{getStatusBadge(employee.employmentStatus)}</div>
                    <div className="text-sm text-gray-900">
                      {employee.employmentType.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="card">
        <div className="card-content">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                    <dd className="text-sm text-gray-900">
                      {employee.firstName} {employee.middleName} {employee.lastName}
                    </dd>
                  </div>
                  {employee.dateOfBirth && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                      <dd className="text-sm text-gray-900">
                        {format(new Date(employee.dateOfBirth), 'MMM dd, yyyy')}
                      </dd>
                    </div>
                  )}
                  {employee.gender && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Gender</dt>
                      <dd className="text-sm text-gray-900">{employee.gender}</dd>
                    </div>
                  )}
                  {employee.maritalStatus && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Marital Status</dt>
                      <dd className="text-sm text-gray-900">{employee.maritalStatus}</dd>
                    </div>
                  )}
                  {employee.nationality && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Nationality</dt>
                      <dd className="text-sm text-gray-900">{employee.nationality}</dd>
                    </div>
                  )}
                </dl>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Employment Information</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Manager</dt>
                    <dd className="text-sm text-gray-900">
                      {employee.manager ? 
                        `${employee.manager.firstName} ${employee.manager.lastName}` : 
                        'N/A'
                      }
                    </dd>
                  </div>
                  {employee.baseSalary && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Base Salary</dt>
                      <dd className="text-sm text-gray-900">
                        {employee.currency} {employee.baseSalary}
                      </dd>
                    </div>
                  )}
                  {employee.probationEndDate && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Probation End Date</dt>
                      <dd className="text-sm text-gray-900">
                        {format(new Date(employee.probationEndDate), 'MMM dd, yyyy')}
                      </dd>
                    </div>
                  )}
                  {employee.skills && employee.skills.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Skills</dt>
                      <dd className="text-sm text-gray-900">
                        <div className="flex flex-wrap gap-2 mt-1">
                          {employee.skills.map((skill, index) => (
                            <Badge key={index} variant="primary" size="sm">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="text-center py-12">
              <p className="text-gray-500">Attendance records will be displayed here</p>
            </div>
          )}

          {activeTab === 'leave' && (
            <div className="text-center py-12">
              <p className="text-gray-500">Leave history will be displayed here</p>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="text-center py-12">
              <p className="text-gray-500">Employee documents will be displayed here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmployeeDetail