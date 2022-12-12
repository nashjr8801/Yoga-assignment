import { statusCode } from 'helpers/constants'

import type { NextApiResponse } from 'next'
import { userFromRequest } from 'controllers/user'
import { CustomeApiRequest } from 'helpers/types'

const auth =
  (handler: Function, authReqd = true) =>
  async (req: CustomeApiRequest, res: NextApiResponse) => {
    // GET CURRENT USER'S AUTHENTICATION STATE
    // ATTACH USER IN THE REQUEST OBJECT
    try {
      let user = await userFromRequest(req)

      if (authReqd && !user) {
        res.status(statusCode.Unauthorized).json({
          status: statusCode.Unauthorized,
          message: 'Unauthorized',
        })
        return
      }

      req.user = user
      return handler(req, res)
    } catch (error) {
      console.log('Auth Middleware ', error)
      return res.status(statusCode.Unauthorized).json(error)
    }
  }

export default auth
