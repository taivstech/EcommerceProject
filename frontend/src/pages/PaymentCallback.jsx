import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from "@/utils/compat"
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Link } from "@/utils/compat"
import { paymentService } from '@/services/paymentService'

function PaymentCallbackContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [status, setStatus] = useState('loading')
    const [gateway, setGateway] = useState('')
    const [orderId, setOrderId] = useState('')
    const [message, setMessage] = useState('')

    useEffect(() => {
        const processCallback = async () => {

            let gatewayParam = searchParams.get('gateway')
            let orderIdParam = searchParams.get('orderId')
            
            if (!gatewayParam) {
                if (searchParams.get('vnp_ResponseCode')) {
                    gatewayParam = 'vnpay'
                } else if (searchParams.get('paymentId')) {
                    gatewayParam = 'paypal'
                } else if (searchParams.get('orderId')) {
                    gatewayParam = 'momo'
                }
            }
            
            if (!orderIdParam) {

                orderIdParam = searchParams.get('vnp_TxnRef') ||
                              searchParams.get('orderId') ||
                              searchParams.get('orderInfo')
            }
            
            setGateway(gatewayParam ? gatewayParam.toUpperCase() : '')
            setOrderId(orderIdParam || '')

            if (!gatewayParam) {
                setStatus('failed')
                setMessage('Missing payment gateway parameter')
                return
            }

            const params = {}
            searchParams.forEach((value, key) => {
                params[key] = value
            })

            const responseCode = searchParams.get('vnp_ResponseCode')
            const transactionStatus = searchParams.get('vnp_TransactionStatus')

            if (responseCode && responseCode !== '00') {
                setStatus('failed')
                setMessage(`Payment failed. Error code: ${responseCode}`)
                return
            }

            const isPaymentSuccessful = responseCode === '00' && transactionStatus === '00'

            try {
                console.log('Payment callback - calling backend with params:', params)
                console.log('Payment callback - API base URL:', import.meta.env.VITE_API_URL || 'https://feeds-hull-jaguar-dreams.trycloudflare.com/api')

                const result = await paymentService.handleCallback(gatewayParam, params)
                console.log('Payment callback - backend response:', result)
                
                if (result.success) {
                    setStatus('success')
                    setMessage(result.message)
                } else {
                    setStatus('failed')
                    setMessage(result.message || 'Payment verification failed')
                }
            } catch (error) {
                console.error('Payment callback error:', error)
                console.error('Payment callback error details:', {
                    message: error?.message,
                    stack: error?.stack,
                    params: params,
                    apiUrl: import.meta.env.VITE_API_URL || 'https://feeds-hull-jaguar-dreams.trycloudflare.com/api'
                })
                const errorMessage = error?.message || 'Failed to verify payment'
                const isNetworkError = errorMessage.includes('Failed to fetch') || 
                                     errorMessage.includes('NetworkError') ||
                                     errorMessage.includes('CORS') ||
                                     errorMessage.includes('ERR_')

                if (isPaymentSuccessful && isNetworkError) {
                    setStatus('success')
                    setMessage('Payment appears successful, but we could not verify with our server. Please check your order status to confirm.')
                } else {
                    setStatus('failed')
                    if (isNetworkError) {
                        setMessage('Cannot connect to payment server. Please check your order status manually in Orders page.')
                    } else {
                        setMessage(errorMessage + '. Please check your order status.')
                    }
                }
            }
        }

        processCallback()
    }, [searchParams])

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                {status === 'loading' && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 size={56} className="text-blue-500 animate-spin" />
                        <h2 className="text-xl font-semibold text-slate-700">Processing your payment...</h2>
                        <p className="text-sm text-slate-400">Please wait a moment</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 size={48} className="text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-green-700">Payment Successful!</h2>
                        <p className="text-sm text-slate-500">
                            {message || `Your order has been paid via ${gateway || 'payment gateway'}.`}
                            <br />
                            The seller will confirm and ship your order soon.
                        </p>
                        <div className="flex gap-3 mt-4">
                            <Link href="/orders"
                                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium">
                                View Orders
                            </Link>
                            <Link href="/"
                                className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm font-medium">
                                Back to Home
                            </Link>
                        </div>
                    </div>
                )}

                {status === 'failed' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                            <XCircle size={48} className="text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-red-700">Payment Failed</h2>
                        <p className="text-sm text-slate-500">
                            {message || `The ${gateway || 'payment'} transaction was unsuccessful.`}
                            <br />
                            Your order has been cancelled automatically. Please try again.
                        </p>
                        <div className="flex gap-3 mt-4">
                            <Link href="/orders"
                                className="px-6 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-900 transition text-sm font-medium">
                                View Orders
                            </Link>
                            <Link href="/cart"
                                className="px-6 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium border border-red-200">
                                Back to Cart
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function PaymentCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[70vh] flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 size={56} className="text-blue-500 animate-spin" />
                        <h2 className="text-xl font-semibold text-slate-700">Loading payment status...</h2>
                        <p className="text-sm text-slate-400">Please wait a moment</p>
                    </div>
                </div>
            </div>
        }>
            <PaymentCallbackContent />
        </Suspense>
    )
}
