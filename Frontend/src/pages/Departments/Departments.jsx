import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { departmentAPI } from '../../services/api'
import Table from '../../components/UI/Table'
import Badge from '../../components/UI/Badge'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import Modal from '../../components/UI/Modal'
import { useAuth } from '../../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

const Departments = () => {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)
  const { hasPermission } = useAuth()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  const { data, isLoading } = useQuery(
    ['departments', page, search],
    () => departmentAPI.getAll({
      page,
      limit: 10,
      search,
    }),
    {
      keepPreviousData: true
    }
  )

  const createMutation = useMutation(
    (data) => departmentAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('departments')
        toast.success('Department created successfully!')
        setShowModal(false)
        reset()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create department')
      }
    }
  )

  const updateMutation = useMutation(
    ({ id, data }) => departmentAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('departments')
        toast.success('Department updated successfully!')
        setShowModal(false)
        setEditingDepartment(null)
        reset()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update department')
      }
    }
  )

  const deleteMutation = useMutation(
    (id) => departmentAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('departments')
        toast.success('Department deleted successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete department')
      }
    }
  )

  const departments = data?.data?.departments || []
  const pagination = data?.data?.pagination

  const handleEdit = (department) => {
    setEditingDepartment(department)
    reset({
      name: department.name,
      description: department.description,
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      deleteMutation.mutate(id)
    }
  }

  const onSubmit = (data) => {
    if (editingDepartment) {
      updateMutation.mutate({ id: editingDepartment.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingDepartment(null)
    reset()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Departments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your organization's departments and teams
          </p>
        </div>
        {hasPermission(['ADMIN', 'HR']) && (
          <button 
            onClick={() => setShowModal(true)} 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
          >
            <PlusIcon className="h-5 w-5 mr-2 -ml-1" />
            Add Department
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search departments..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Departments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <Table.Header>
              <Table.Row className="bg-gray-50">
                <Table.Head className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</Table.Head>
                <Table.Head className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</Table.Head>
                <Table.Head className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</Table.Head>
                <Table.Head className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employees</Table.Head>
                <Table.Head className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</Table.Head>
                {hasPermission(['ADMIN', 'HR']) && (
                  <Table.Head className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</Table.Head>
                )}
              </Table.Row>
            </Table.Header>
            <Table.Body className="bg-white divide-y divide-gray-200">
              {departments.map((department) => (
                <Table.Row key={department.id} className="hover:bg-gray-50 transition-colors">
                  <Table.Cell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {department.name}
                    </div>
                  </Table.Cell>
                  <Table.Cell className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {department.description || 'N/A'}
                    </div>
                  </Table.Cell>
                  <Table.Cell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {department.manager ? 
                        `${department.manager.firstName} ${department.manager.lastName}` : 
                        'N/A'
                      }
                    </div>
                  </Table.Cell>
                  <Table.Cell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {department._count?.employees || 0}
                    </div>
                  </Table.Cell>
                  <Table.Cell className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={department.isActive ? 'success' : 'error'}>
                      {department.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Table.Cell>
                  {hasPermission(['ADMIN', 'HR']) && (
                    <Table.Cell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => handleEdit(department)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(department.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </Table.Cell>
                  )}
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          {departments.length === 0 && (
            <div className="text-center py-12 bg-gray-50">
              <p className="text-gray-500">No departments found</p>
              {hasPermission(['ADMIN', 'HR']) && (
                <button 
                  onClick={() => setShowModal(true)} 
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                >
                  <PlusIcon className="h-5 w-5 mr-2 -ml-1" />
                  Create your first department
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-white border-t border-gray-200 rounded-b-lg">
          <div className="text-sm text-gray-700 mb-4 sm:mb-0">
            Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
            <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="font-medium">{pagination.total}</span> results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.pages}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title={editingDepartment ? 'Edit Department' : 'Create Department'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name', { required: 'Department name is required' })}
              type="text"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150"
              placeholder="Enter department name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150"
              placeholder="Enter department description"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button 
              type="button" 
              onClick={closeModal} 
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isLoading || updateMutation.isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {(createMutation.isLoading || updateMutation.isLoading) && (
                <LoadingSpinner size="sm" className="mr-2" />
              )}
              {editingDepartment ? 'Update Department' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Departments