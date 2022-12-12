import { paymentInDb } from 'helpers/types'
import mongoose from 'mongoose'

const PaymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
    },
    status: {
      type: String,
      required: true,
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      required: true,
      default: 'online',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

const Payment =
  mongoose.models.Payment || mongoose.model('Payment', PaymentSchema)

// get payment for current month
const getPaymentForCurrentMonth = async (userId: string) => {
  const start = new Date()
  start.setDate(1)
  const end = new Date()
  end.setDate(31)
  const payment = await Payment.findOne({
    user: userId,
    createdAt: {
      $gte: start,
      $lt: end,
    },
  })
  return payment
}

export { getPaymentForCurrentMonth }

export default Payment
