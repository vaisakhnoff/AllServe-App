import mongoose ,{Schema,Document} from "mongoose";
import { Role } from "../shared/enums/role.enum";
import { Status } from "../shared/enums/status.enum";

export interface IUser extends Document {

    name: string;
    email: string;
    password: string;
    phone?: string;
    profileImage?: string;
    role: Role;
    isVerified: boolean;
    status: Status;
    walletBalance: number;
    addresses: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
        isDefault: boolean;
    }[];
    paymentMethods: {
        type: string;
        details: string;
        isDefault: boolean;
    }[];
}

const userSchema = new Schema<IUser>(

    {
        name : {type : String,required  : true },
        email : {type :String, required:true, unique : true},
        password : {type : String , required : true},
        role: {
            type: String,
            enum: Object.values(Role),
            default: Role.USER
        },
        phone: { type: String },
        profileImage: { type: String },
        isVerified: { type: Boolean, default: false },
        status: {
            type: String,
            enum: Object.values(Status),
            default: Status.ACTIVE
        },
        walletBalance: { type: Number, default: 0 },
        addresses: [{
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            zip: { type: String, required: true },
            country: { type: String, required: true },
            isDefault: { type: Boolean, default: false }
        }],
        paymentMethods: [{
            type: { type: String, required: true },
            details: { type: String, required: true },
            isDefault: { type: Boolean, default: false }
        }]
    },
    { timestamps: true }
)

export const UserModel = mongoose.model<IUser>("User", userSchema);

