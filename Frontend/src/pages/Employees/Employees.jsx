import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { employeeAPI } from '../../services/api'
import Table from '../../components/UI/Table'
import Badge from '../../components/UI/Badge'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { useAuth } from '../../contexts/AuthContext'
import { format } from 'date-fns'

const Employees = () => {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    departmentId: '',
    employmentStatus: '',
    employmentType: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  const { hasPermission } = useAuth()

  const { data, isLoading, error } = useQuery(
    ['employees', page, search, filters],
    () => employeeAPI.getAll({
      page,
      limit: 10,
      search,
      ...filters
    }),
    {
      keepPreviousData: true
    }
  )

  const employees = data?.data?.employees || []
  const pagination = data?.data?.pagination

  const getStatusBadge = (status) => {
    const variants = {
      ACTIVE: 'success',
      INACTIVE: 'warning',
      TERMINATED: 'error',
      ON_LEAVE: 'info',
      PROBATION: 'warning'
    }
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>
  }

  const getEmploymentTypeBadge = (type) => {
    const variants = {
      FULL_TIME: 'primary',
      PART_TIME: 'info',
      CONTRACT: 'warning',
      INTERN: 'default',
      CONSULTANT: 'default'
    }
    return <Badge variant={variants[type] || 'default'}>{type.replace('_', ' ')}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading employees: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Employee Directory</h1>
          <p className="mt-1 text-sm text-gray-600">
            {employees.length} active employees in your organization
          </p>
        </div>
        {hasPermission(['ADMIN', 'HR']) && (
          <Link 
            to="/employees/create" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2 -ml-1" />
            Add Employee
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search employees..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Toggle Filters Button (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </button>

            {/* Status Filter (Desktop) */}
            <div className="hidden sm:block">
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={filters.employmentStatus}
                onChange={(e) => setFilters({ ...filters, employmentStatus: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="TERMINATED">Terminated</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="PROBATION">Probation</option>
              </select>
            </div>

            {/* Type Filter (Desktop) */}
            <div className="hidden sm:block">
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={filters.employmentType}
                onChange={(e) => setFilters({ ...filters, employmentType: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
                <option value="CONSULTANT">Consultant</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            <button
              onClick={() => {
                setSearch('')
                setFilters({ departmentId: '', employmentStatus: '', employmentType: '' })
              }}
              className="hidden sm:inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Clear Filters
            </button>
          </div>

          {/* Mobile Filters Panel */}
          {showFilters && (
            <div className="mt-4 sm:hidden space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={filters.employmentStatus}
                  onChange={(e) => setFilters({ ...filters, employmentStatus: e.target.value })}
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="TERMINATED">Terminated</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="PROBATION">Probation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={filters.employmentType}
                  onChange={(e) => setFilters({ ...filters, employmentType: e.target.value })}
                >
                  <option value="">All Types</option>
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERN">Intern</option>
                  <option value="CONSULTANT">Consultant</option>
                </select>
              </div>
              <button
                onClick={() => {
                  setSearch('')
                  setFilters({ departmentId: '', employmentStatus: '', employmentType: '' })
                }}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <Table.Header>
              <Table.Row className="bg-gray-50">
                <Table.Head className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </Table.Head>
                <Table.Head className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </Table.Head>
                <Table.Head className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </Table.Head>
                <Table.Head className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </Table.Head>
                <Table.Head className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </Table.Head>
                <Table.Head className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hire Date
                </Table.Head>
                <Table.Head className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <Table.Row key={employee.id} className="hover:bg-gray-50 transition-colors">
                  <Table.Cell className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-800">
                            {employee.firstName[0]}{employee.lastName[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {employee.department?.name || 'N/A'}
                    </div>
                  </Table.Cell>
                  <Table.Cell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {employee.position?.title || 'N/A'}
                    </div>
                  </Table.Cell>
                  <Table.Cell className="px-6 py-4 whitespace-nowrap">
                    {getEmploymentTypeBadge(employee.employmentType)}
                  </Table.Cell>
                  <Table.Cell className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(employee.employmentStatus)}
                  </Table.Cell>
                  <Table.Cell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(employee.hireDate), 'MMM dd, yyyy')}
                    </div>
                  </Table.Cell>
                  <Table.Cell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/employees/${employee.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View Details
                    </Link>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          {employees.length === 0 && (
            <div className="text-center py-12 bg-gray-50">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No employees found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria
              </p>
              {hasPermission(['ADMIN', 'HR']) && (
                <div className="mt-6">
                  <Link
                    to="/employees/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <PlusIcon className="h-5 w-5 mr-2 -ml-1" />
                    Add New Employee
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-b-lg">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.pages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Employees