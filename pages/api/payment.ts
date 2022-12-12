import {
  checkUserEligibilityForCurrentMonth,
  makeCurrentMonthPayment,
} from 'controllers/user'
import { statusCode } from 'helpers/constants'
import dbConnect from 'helpers/dbConnect'
import { CustomeApiRequest } from 'helpers/types'
import auth from 'middlewares/auth'
import { NextApiResponse } from 'next'

dbConnect()

const handler = async (req: CustomeApiRequest, res: NextApiResponse) => {
  const method = req.method

  switch (method) {
    case 'POST':
      let { status, data } = await makeCurrentMonthPayment(req.user)
      return res.status(status).json(data)

    case 'GET':
      let isEligible = await checkUserEligibilityForCurrentMonth(req.user)

      if (!isEligible) {
        return res
          .status(statusCode.Unauthorized)
          .json({ message: 'Unauthorized' })
      }

      return res
        .status(statusCode.Success)
        .json({ message: 'User is eligible for payment' })
  }
}

export default auth(handler, true)
