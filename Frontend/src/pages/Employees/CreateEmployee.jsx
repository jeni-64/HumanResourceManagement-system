import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from 'react-query'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { employeeAPI, departmentAPI } from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import toast from 'react-hot-toast'

const CreateEmployee = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm()

  // Fetch departments for dropdown
  const { data: departmentsData } = useQuery(
    'departments',
    () => departmentAPI.getAll({ limit: 100 })
  )

  const departments = departmentsData?.data?.departments || []

  const createEmployeeMutation = useMutation(
    (data) => employeeAPI.create(data),
    {
      onSuccess: () => {
        toast.success('Employee created successfully!')
        navigate('/employees')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create employee')
      }
    }
  )

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      // Format the data
      const formattedData = {
        ...data,
        hireDate: new Date(data.hireDate).toISOString(),
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined,
        baseSalary: data.baseSalary ? parseFloat(data.baseSalary) : undefined,
      }
      
      await createEmployeeMutation.mutateAsync(formattedData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/employees" className="btn-outline">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Employee</h1>
          <p className="text-sm text-gray-500">Create a new employee record</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Employee ID *
                </label>
                <input
                  {...register('employeeId', { required: 'Employee ID is required' })}
                  type="text"
                  className="input mt-1"
                  placeholder="EMP001"
                />
                {errors.employeeId && (
                  <p className="mt-1 text-sm text-red-600">{errors.employeeId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  type="email"
                  className="input mt-1"
                  placeholder="john.doe@company.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <input
                  {...register('firstName', { required: 'First name is required' })}
                  type="text"
                  className="input mt-1"
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <input
                  {...register('lastName', { required: 'Last name is required' })}
                  type="text"
                  className="input mt-1"
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Middle Name
                </label>
                <input
                  {...register('middleName')}
                  type="text"
                  className="input mt-1"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="input mt-1"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <input
                  {...register('dateOfBirth')}
                  type="date"
                  className="input mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Gender
                </label>
                <select {...register('gender')} className="input mt-1">
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Marital Status
                </label>
                <select {...register('maritalStatus')} className="input mt-1">
                  <option value="">Select Status</option>
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="DIVORCED">Divorced</option>
                  <option value="WIDOWED">Widowed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nationality
                </label>
                <input
                  {...register('nationality')}
                  type="text"
                  className="input mt-1"
                  placeholder="American"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Employment Details</h3>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select {...register('departmentId')} className="input mt-1">
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Employment Type *
                </label>
                <select
                  {...register('employmentType', { required: 'Employment type is required' })}
                  className="input mt-1"
                >
                  <option value="">Select Type</option>
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERN">Intern</option>
                  <option value="CONSULTANT">Consultant</option>
                </select>
                {errors.employmentType && (
                  <p className="mt-1 text-sm text-red-600">{errors.employmentType.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Hire Date *
                </label>
                <input
                  {...register('hireDate', { required: 'Hire date is required' })}
                  type="date"
                  className="input mt-1"
                />
                {errors.hireDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.hireDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Base Salary
                </label>
                <input
                  {...register('baseSalary')}
                  type="number"
                  step="0.01"
                  className="input mt-1"
                  placeholder="50000.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Employment Status
                </label>
                <select {...register('employmentStatus')} className="input mt-1">
                  <option value="ACTIVE">Active</option>
                  <option value="PROBATION">Probation</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  {...register('address')}
                  rows={3}
                  className="input mt-1"
                  placeholder="123 Main Street, Apt 4B"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  {...register('city')}
                  type="text"
                  className="input mt-1"
                  placeholder="New York"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  {...register('state')}
                  type="text"
                  className="input mt-1"
                  placeholder="NY"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <input
                  {...register('country')}
                  type="text"
                  className="input mt-1"
                  placeholder="United States"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ZIP Code
                </label>
                <input
                  {...register('zipCode')}
                  type="text"
                  className="input mt-1"
                  placeholder="10001"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Link to="/employees" className="btn-outline">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center"
          >
            {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
            Create Employee
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateEmployee