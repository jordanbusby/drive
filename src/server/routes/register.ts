import { Request, Response, Router } from 'express';
import { validate, registerUserSchema, registerOrganizationSchema } from '../validation';
import { User, Organization } from '../models';
import { verifyLoggedOut, catchAsync } from '../middleware';
import { BadRequest } from '../errors';

const router: Router = Router();


router.post('/register', catchAsync(async (req: Request, res: Response) => {

    const { registerOrganization: registerOrganization = false, ...details } = req.body

    if (registerOrganization) {

        await validate(registerOrganizationSchema, details)
        let { companyName, folderAbsolutePath, companyImage } = details
        const found = await Organization.exists({ companyName })

        if (found) {
            throw new BadRequest('Invalid E-Mail')
        }

        const organization = await Organization.create({
            companyName,
            folderAbsolutePath,
            companyImage
        })

        res.json({message: `${companyName} successfully created.`})
        return
    }

    await validate(registerUserSchema, details);

    let { email, name, password, organization, root, level }:
        { email: string, name: string, password: string, organization: string, root: string, level: 'user' | 'admin' | 'super' } = details;

    const found = await User.exists({ email })
    const userOrganization = await Organization.findOne({ companyName: organization })

    if (found || !userOrganization) {
        throw new BadRequest(found ? 'Invalid E-Mail' : `Invalid company: ${organization}`);
    }

    if (level === 'super') {
        root = '/filestore'
    }

    const user = await User.create({ email, name, password, organization, root, level })

    const addEmployee = await userOrganization.addEmployee(user)
    if (!addEmployee) {
        res.json({message: `Error: ${user.name} not added to ${userOrganization.companyName}`})
        return
    }

    res.json({message: `User ${user.name} succesfully created.`})

}))

export default router;