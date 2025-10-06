import express, { Request, Response } from 'express';
import { AuthPayload, OAuth, signInSchema, signUpSchema, User, UserSignInInput, UserSignUpInput } from '../../lib/user';
import { compare, hash } from 'bcryptjs';
import { createToken, generateRandomPassword } from '../../utils/jwt';
import prisma from '../../../prisma/prisma';
import { admin } from '../../utils/firebase';


const router = express.Router();


router.post("/signup", async (request: Request<{}, {}, UserSignUpInput>, response: Response) => {
    try {

        const result = signUpSchema.safeParse(request.body);

        if (!result.success) {
            response.status(400).json(result); return;
        }

        const { password, confirm_password, ...userInput } = <any>result.data;
        userInput.password_hash = await hash(password, 10);
        // create jwt token based in the email and password
        const token: string = await createToken(userInput.email, userInput.password_hash);
        // create the user 
        const user: any = await prisma.users.create({ data: userInput });
        delete user.password_hash
        // in case every thing when well , create and auth payload and return it to the client 
        const authPayload: AuthPayload = {
            user,
            token
        }

        response.status(200).json({
            success: true, 
            data: authPayload
        });
        return;


    } catch (errors) {
        response.status(400).json({ errors });
        return;
    }
});



router.post("/signin", async (request: Request<{}, {}, UserSignInInput>, response: Response) => {

    try {

        const result = signInSchema.safeParse(request.body);

        if (!result.success) {
            response.status(400).json(result); return;
        }

        const user: any = await prisma.users.findUnique({
            where: {
                email: result.data.email
            }
        })

        if (!user || ! await compare(result.data.password, user.password_hash)) {
            response.status(403).send({
                success: false,
                message: "wrong credentials"
            });
            return;
        }
        // create token if the credentials are right 
        const token: string = await createToken(user.email, user.password_hash);
        // in case every thing when well , create and auth payload and return it to the client 
        const authPayload: AuthPayload = {
            user,
            token
        }
        response.status(200).send({
            success: true,
            messaage: "Sign in Successful",
            data: authPayload
        });
    } catch (error) {
        response.status(400).send({
            success: false,
            message: error
        })
    }
});


router.post('/oauth', async (request: Request<{}, {}, OAuth>, response: Response) => {
    try {
        const { token: idToken } = request.body;
        if (!idToken) {
            response.status(400).json({ message: 'Token is required' });
            return
        }
        // Verify the Google ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);

        let { email, name, picture } = decodedToken;

        const full_name = name ? name : email.split("@")?.[0] || "Unnamed";
        const provider = decodedToken.firebase?.sign_in_provider || 'anonymous'

        let user: any = await prisma.users.findUnique({ where: { email } });
        if (!user) {
            user = await prisma.users.create({
                data: {
                    email,
                    full_name: full_name,
                    picture_url: picture,
                    password_hash: generateRandomPassword(),
                    provider: provider as any
                }
            });
        }

        else {
            if (picture && !user.picture_url)
                await user.update({ data: { picture_url: picture } })
        }
        // create jwt token based in the email and password
        const token: string = await createToken(user.email, user.password_hash);

        delete user.password_hash;
        // in case every thing when well , create and auth payload and return it to the client 
        const authPayload: AuthPayload = {
            user: user,
            token
        }
        
        response.status(200).send({
            success: true, 
            data: authPayload
        });

    } catch (error) {

        response.status(400).send({
            success: false,
            message: error
        })
    }

})
export { router as authRouter };
