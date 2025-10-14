import cron from 'node-cron';
import prisma from '../../prisma/prisma';
import { user_subscriptions_status_enum } from '@prisma/client';


// Schedule: "0 0 * * *" → every day at 00:00
cron.schedule("0 0 * * *", async () => {

  const currentDate = new Date() ; 
  
  const susbcriptionsToExpire = await prisma.user_subscriptions.updateMany({ 
    where  :  { 
      status : user_subscriptions_status_enum.active , 

      end_date : { 
        gte : currentDate 
      } , 
      subscription_plans : { 
        price : {
          gt : 0  
        }
      }
    } ,  
    data : {
      status : user_subscriptions_status_enum.expired
    }
  }) ; 


  console.log('Running subscription expiration job...');
  console.log ('Number of expired subscriptions : ' ,   susbcriptionsToExpire.count)
});