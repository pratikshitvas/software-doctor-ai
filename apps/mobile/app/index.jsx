import {useEffect,useState} from "react";
import {ActivityIndicator,FlatList,RefreshControl,SafeAreaView,Text,View,StyleSheet} from "react-native";
import * as SecureStore from "expo-secure-store";
const API=process.env.EXPO_PUBLIC_API_URL||"http://localhost:4000";
export default function Home(){
 const [items,setItems]=useState([]),[error,setError]=useState("Sign in through the web app first; mobile sign-in is the next build step."),[busy,setBusy]=useState(false);
 async function load(){setBusy(true);try{
  const token=await SecureStore.getItemAsync("accessToken");
  if(!token)throw Error("No secure session found. Mobile account sign-in is not enabled yet.");
  const r=await fetch(API+"/api/monitoring/incidents",{headers:{authorization:"Bearer "+token}});
  const d=await r.json();if(!r.ok)throw Error(d.error||"Could not load incidents.");
  setItems(d.incidents);setError("");
 }catch(e){setError(e.message)}finally{setBusy(false)}}
 useEffect(()=>{load()},[]);
 return <SafeAreaView style={s.page}><Text style={s.brand}>SOFTWARE DOCTOR AI</Text><Text style={s.title}>Incident review</Text><Text style={s.sub}>Monitor and review project health</Text>{error?<View style={s.notice}><Text style={s.noticeText}>{error}</Text></View>:null}{busy&&!items.length?<ActivityIndicator color="#79a8ff"/>:<FlatList data={items} keyExtractor={x=>x.id} refreshControl={<RefreshControl refreshing={busy} onRefresh={load} tintColor="#79a8ff"/>} ListEmptyComponent={<Text style={s.empty}>No incidents recorded.</Text>} renderItem={({item})=><View style={s.card}><Text style={s.project}>{item.project?.name} · {item.severity}</Text><Text style={s.message}>{item.title}</Text><Text style={s.meta}>{item.eventCount} events · {new Date(item.lastSeenAt).toLocaleString()}</Text></View>}/>}</SafeAreaView>
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:"#080c16",padding:22,paddingTop:45},brand:{color:"#8bb3ff",fontSize:11,letterSpacing:2,fontWeight:"700"},title:{color:"#eef3ff",fontSize:28,fontWeight:"700",marginTop:20},sub:{color:"#8492aa",marginTop:5,marginBottom:18},notice:{padding:14,backgroundColor:"#251e17",borderColor:"#634c32",borderWidth:1,borderRadius:9,marginBottom:15},noticeText:{color:"#ffd191",fontSize:13,lineHeight:19},card:{backgroundColor:"#101725",borderColor:"#202a3c",borderWidth:1,borderRadius:10,padding:15,marginBottom:10},project:{color:"#86aeff",fontSize:11,fontWeight:"700"},message:{color:"#edf1f8",fontSize:14,marginTop:8},meta:{color:"#8190a5",fontSize:10,marginTop:10},empty:{color:"#8190a5",textAlign:"center",padding:30}});