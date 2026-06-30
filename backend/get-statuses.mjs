import mongoose from "mongoose";

async function main() {
  await mongoose.connect("mongodb+srv://vaisakhi228:0T1kXQ8ZgV28YhC0@cluster0.b04r1.mongodb.net/AllServeApp-NewDb?retryWrites=true&w=majority&appName=Cluster0");
  
  const statuses = await mongoose.connection.db.collection('serviceorders').distinct("status");
  console.log("Distinct statuses in DB:", statuses);
  
  const providerOrder = await mongoose.connection.db.collection('serviceorders').findOne({providerId: {$exists: true}});
  if(providerOrder) {
     console.log("Orders for a provider:");
     const pOrders = await mongoose.connection.db.collection('serviceorders').find({providerId: providerOrder.providerId}).project({status: 1, deliveryModel: 1, subMode: 1}).limit(10).toArray();
     console.log(pOrders);
  }
  
  await mongoose.disconnect();
}
main();
