import prisma from '@/database'
import { Cron } from 'croner'

const autoRemoveRefreshTokenJob = () => {
  new Cron('@hourly', async () => {
        try {
            await prisma.refreshToken.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date()
                    }
                }
            })
        } catch (error) {
            console.error(error)
        }
    })
}

export default autoRemoveRefreshTokenJob