import { PrismaClient, Provider, users_user_type_enum } from '@prisma/client'
const prisma = new PrismaClient();

import { hash } from 'bcryptjs';

async function main() {


    const password_hash = await hash("akarcom123", 10)
    // Example: create sample users
    await prisma.users.create({
        data: {
            full_name: "Admin",
            email: "akarcom.contact@gmail.com",
            password_hash,
            user_type: users_user_type_enum.admin,
            provider: Provider.password,
        }
    })
}



main().then(() => {
    console.log("Adming seeded")
    process.exit(0)
}).catch((e) => {
    console.error("Failed to seed admin : ", e);
    process.exit(1)

})