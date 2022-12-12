import { internalError, statusCode } from 'helpers/constants'
import {
  ApiController,
  LoginParams,
  paymentInDb,
  userInDb,
} from 'helpers/types'
import { encryptPassword, verifyPassword } from 'helpers/utils'
import { IncomingMessage } from 'http'
import * as User from 'models/User'
import { NextApiRequestCookies } from 'next/dist/server/api-utils'
import jwt from 'jsonwebtoken'
import Payment, { getPaymentForCurrentMonth } from 'models/Payments'

export const createUser = async (
  userDetails: userInDb
): Promise<ApiController<userInDb>> => {
  try {
    if (!userDetails) return { status: statusCode.Unauthorized }

    let password = await encryptPassword(userDetails.password)
    let userFromDb = await User.insertOne({ ...userDetails, password })

    userFromDb.password = ''
    return { status: statusCode.Success, data: userFromDb }
  } catch (error) {
    console.log('Authentication new', error)
    return internalError
  }
}

export const loginUser = async (
  loginParams: LoginParams
): Promise<ApiController<userInDb>> => {
  try {
    if (!loginParams) return { status: statusCode.Unauthorized }

    let userFromDb = await User.findOne({ email: loginParams.email })
    if (!userFromDb) return { status: statusCode.Unauthorized }

    let isPasswordCorrect = await verifyPassword(
      userFromDb.password,
      loginParams.password
    )
    if (!isPasswordCorrect) return { status: statusCode.Unauthorized }

    delete userFromDb.password
    return { status: statusCode.Success, data: userFromDb }
  } catch (error) {
    console.log('Authentication error', error)
    return internalError
  }
}

export const userFromRequest = async (
  req: IncomingMessage & { cookies: NextApiRequestCookies }
): Promise<userInDb | undefined> => {
  try {
    let token = req.cookies.auth
    if (!token) return undefined

    const data = jwt.verify(token, process.env.JWT_SECRET_KEY) as {
      email: string
    }
    if (!data) return undefined

    let userFromDb = await User.findOne({ email: data.email })

    if (userFromDb) delete userFromDb.password
    return userFromDb
  } catch (error) {
    console.log('Authentication error', error)
    return
  }
}

export const checkUserEligibilityForCurrentMonth = async (
  user: userInDb
): Promise<boolean | undefined> => {
  try {
    // Fetch a payment from this month
    let payment = await Payment.findOne({
      user: user._id,
      createdAt: {
        $gte: new Date(new Date().setDate(1)),
        $lt: new Date(new Date().setDate(31)),
      },
      status: 'success',
    })

    if (!payment) return false
    return true
  } catch (error) {
    console.log('Auth Middleware ', error)
    return
  }
}

export const getAllPaymentsByUser = async (
  user: userInDb
): Promise<ApiController<paymentInDb[]>> => {
  try {
    let payments = await Payment.find({ user: user._id })

    return { status: statusCode.Success, data: payments }
  } catch (error) {
    console.log('Auth Middleware ', error)
    return internalError
  }
}

export const makeCurrentMonthPayment = async (
  user: userInDb
): Promise<ApiController<string>> => {
  try {
    let payment = await getPaymentForCurrentMonth(user._id)
    if (payment)
      return { status: statusCode.Exists, data: 'Payment already exists!' }

    payment = await Payment.create({
      amount: 500,
      currency: 'INR',
      status: 'success',
      paymentMethod: 'online',
      user: user._id,
    })

    return { status: statusCode.Success, data: payment }
  } catch (error) {
    console.log('Auth Middleware ', error)
    return internalError
  }
}
