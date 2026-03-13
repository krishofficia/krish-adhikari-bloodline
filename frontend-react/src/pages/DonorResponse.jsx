import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

function DonorResponse() {
  const { requestId, action } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [requestDetails, setRequestDetails] = useState(null)
  const [donorInfo, setDonorInfo] = useState(null)

  useEffect(() => {
    loadRequestDetails()
  }, [])

  const loadRequestDetails = async () => {
    try {
      const token = localStorage.getItem('token')
      const user = JSON.parse(localStorage.getItem('user') || '{}')

      if (!token || !user._id) {
        setError('Please login to respond to this request')
        setLoading(false)
        return
      }

      // Get request details
      const response = await fetch(`/api/blood-requests/donor/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRequestDetails(data.data)
        setDonorInfo({
          donorId: user._id,
          donorName: user.fullName,
          donorEmail: user.email,
          donorPhone: user.phone || ''
        })
      } else {
        setError('Failed to load request details')
      }
    } catch (error) {
      console.error('Error loading request details:', error)
      setError('Error loading request details')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitResponse = async () => {
    if (!action || !requestDetails || !donorInfo) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      const endpoint = action === 'accept' 
        ? `/api/blood-requests/donor/${requestId}/accept`
        : `/api/blood-requests/donor/${requestId}/decline`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(donorInfo)
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess(data.message)
        
        // Redirect to donor dashboard after 3 seconds
        setTimeout(() => {
          navigate('/donor/dashboard')
        }, 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to submit response')
      }
    } catch (error) {
      console.error('Error submitting response:', error)
      setError('Error submitting response')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !requestDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading request details...</p>
        </div>
      </div>
    )
  }

  if (error && !requestDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/donor/dashboard')}
              className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-red-600 text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Blood Request Response</h1>
        </div>
      </div>

      <div className="container mx-auto p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            {success ? (
              <div className="text-center">
                <div className="text-green-600 text-5xl mb-4">
                  {action === 'accept' ? '✅' : '📝'}
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  {action === 'accept' ? 'Request Accepted!' : 'Response Recorded'}
                </h2>
                <p className="text-gray-600 mb-6">{success}</p>
                <p className="text-gray-500">Redirecting to dashboard...</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Blood Request Details
                  </h2>
                  {requestDetails && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Organization</p>
                          <p className="font-semibold">{requestDetails.organizationId?.name || 'Hospital'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Blood Group</p>
                          <p className="font-semibold text-red-600">{requestDetails.bloodGroup}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Location</p>
                          <p className="font-semibold">{requestDetails.location}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Hospital</p>
                          <p className="font-semibold">{requestDetails.hospitalName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Units Needed</p>
                          <p className="font-semibold">{requestDetails.quantity} units</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Required Date</p>
                          <p className="font-semibold">
                            {new Date(requestDetails.requiredDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Urgency</p>
                          <p className="font-semibold text-red-600">{requestDetails.urgencyLevel}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Your Response
                  </h3>
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="text-gray-700">
                      You are about to <strong>{action}</strong> this blood request.
                    </p>
                    {action === 'accept' ? (
                      <p className="text-gray-600 mt-2">
                        By accepting, you commit to donating blood for this request. 
                        The hospital will contact you with further details.
                      </p>
                    ) : (
                      <p className="text-gray-600 mt-2">
                        Thank you for considering this request. We understand that 
                        circumstances may prevent you from donating at this time.
                      </p>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={handleSubmitResponse}
                    disabled={loading}
                    className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
                      action === 'accept'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </span>
                    ) : (
                      <>
                        {action === 'accept' ? '✅ Accept Request' : '❌ Decline Request'}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => navigate('/donor/dashboard')}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DonorResponse
