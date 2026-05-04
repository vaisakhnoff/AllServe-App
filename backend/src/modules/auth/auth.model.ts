import mongoose ,{Schema,Document} from "mongoose";
import { Role } from "../../shared/enums/role.enum";
import { Status } from "../../shared/enums/status.enum";
import { string } from "zod/v4/classic/coerce.cjs";

export interface IUser extends Document {

    name : string;
    email : string;
    password : string;
    role : Role;
    isVerified : boolean;
    status : Status
}

const userSchema = new Schema<IUser>(

    {
        name : {type : String,required  : true },
        email : {type :String, required:true, unique : true},
        password : {type : String , required : true},
        role :{
            type : String,
            enum : Object.values(Role),
            default : Role.USER
        },
        isVerified :{type : Boolean ,default :false},
        status :{
            type : String,
            enum : Object.values(Status),
            default : Status.ACTIVE
        }
    },
    {timestamps : true}
)

export const UserModel = mongoose.model<IUser>("User", userSchema);