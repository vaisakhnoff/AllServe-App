

type IdPrefix = "USR" | "PRV" | "BKG" | "SVC" | "REQ" | "ALL";


export function formatDisplayId(mongoId : string , prefix : IdPrefix = "ALL" ){

    if(!mongoId || mongoId.length < 8) return mongoId;

    const short = mongoId.slice(-8).toUpperCase();

    return  `${prefix}-${short}`;
}

export const displayId ={
    user :(id : string) => formatDisplayId(id,"USR"),
    provider : (id:string) =>formatDisplayId(id,"PRV"),
    booking : (id: string) =>formatDisplayId(id,"BKG"),
    service : (id:string) => formatDisplayId(id,"SVC"),
    request: (id: string) => formatDisplayId(id, "REQ"),
  generic: (id: string) => formatDisplayId(id, "ALL"),
}