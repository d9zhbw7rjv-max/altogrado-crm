import { useState, useEffect, useCallback, useRef } from "react";

const CONFIG = {
  SHEET_ID: "YOUR_GOOGLE_SHEET_ID",
  API_KEY: "YOUR_GOOGLE_SHEETS_API_KEY",
  MAKE_WEBHOOK_E5: "https://hook.us2.make.com/jyfj767nmqfnpj7uk8srlyvudficta7x",
  MAKE_WEBHOOK_RESULT: "https://hook.eu1.make.com/YOUR_RESULTADO_URL",
  CURRENT_USER: { id: "VEND-001", name: "Areli Rios", email: "areli@altogradolabdental.com" },
};

const ZONAS_LIST = ['ANZURES','AZCAPOTZALCO','BENITO JUAREZ','CENTRO','CLAVERIA',
  'CONDESA Y ROMA','COPILCO UNIVERSIDAD','COYOACAN','CUAUHTEMOC','DEL VALLE',
  'GRANADA','GUSTAVO A MADERO','IZTAPALAPA','LOMAS DE CHAPULTEPEC','LOMAS VERDES',
  'NAPOLES','NARVARTE','NAUCALPAN','PEDREGAL','POLANCO','POPOTLA',
  'SAN MIGUEL CHAPULTEPEC','SAN RAFAEL','SANTA FE','SATELITE','TLALPAN',
  'TLANEPANTLA','TLATELOLCO','VILLA COAPA'];

const ESTADO_CONFIG = {
  NUEVO:{color:"#94A3B8",bg:"#F8FAFC",label:"Nuevo"},
  EN_ZONA:{color:"#60A5FA",bg:"#EFF6FF",label:"En Zona"},
  LLAMADA_PENDIENTE:{color:"#8B5CF6",bg:"#EDE9FE",label:"Llamada Pend."},
  NO_CONTESTA_1:{color:"#F59E0B",bg:"#FFFBEB",label:"NC ×1"},
  NO_CONTESTA_2:{color:"#F97316",bg:"#FFF7ED",label:"NC ×2"},
  NO_CONTESTA_MAX:{color:"#EF4444",bg:"#FEF2F2",label:"NC Max"},
  CALLBACK_SOLICITADO:{color:"#A78BFA",bg:"#F5F3FF",label:"Callback"},
  CITA_AGENDADA:{color:"#10B981",bg:"#ECFDF5",label:"Cita Agendada"},
  VISITADO_INTERESADO:{color:"#0EA5E9",bg:"#E0F2FE",label:"Interesado"},
  VISITADO_NO_INTERESADO:{color:"#6B7280",bg:"#F3F4F6",label:"No Interesado"},
  PRIMER_PEDIDO:{color:"#EC4899",bg:"#FCE7F3",label:"Primer Pedido"},
  CLIENTE_ACTIVO:{color:"#059669",bg:"#D1FAE5",label:"Cliente"},
  DESCARTADO:{color:"#DC2626",bg:"#FEF2F2",label:"Descartado"},
};

const OBJECIONES = [
  { value:"YA_TIENE_LAB", label:"Ya tiene laboratorio", icon:"🏥" },
  { value:"PRECIO", label:"Precio / muy caro", icon:"💰" },
  { value:"FUTURA_LABS", label:"Contrato con Futura Labs", icon:"📄" },
  { value:"OTRO_LAB_CONSIDERA", label:"Otro lab pero nos considera", icon:"🤝" },
  { value:"SIN_TIEMPO", label:"Sin tiempo para visita", icon:"⏰" },
  { value:"NO_INTERESA", label:"No le interesa", icon:"❌" },
  { value:"NINGUNA", label:"Sin objeción", icon:"✅" },
];

const RESULTADO_VISITA = [
  { value:"INTERESADO", label:"Interesado", icon:"✅", color:"#10B981" },
  { value:"NECESITA_PENSAR", label:"Lo piensa", icon:"🤔", color:"#F59E0B" },
  { value:"NO_INTERESADO", label:"No interesa", icon:"❌", color:"#EF4444" },
  { value:"NO_ESTABA", label:"No estaba", icon:"🚪", color:"#64748B" },
];

const today = new Date();
const fmt = d => d.toISOString().split("T")[0];
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate()+n); return r; };
const getWeekKey = d => {
  const jan1 = new Date(d.getFullYear(),0,1);
  const w = Math.ceil(((d-jan1)/86400000+jan1.getDay()+1)/7);
  return `${d.getFullYear()}-W${String(w).padStart(2,"0")}`;
};
const W0 = getWeekKey(today);
const W1 = getWeekKey(addDays(today,7));
const W2 = getWeekKey(addDays(today,14));

const MOCK = [
  {id:"PRO-0002",nombre:"Dentistakids",doctor:"",telefono:"+525562036910",email:"dentistakidscontacto@gmail.com",direccion:"C. Gobernador Ignacio Esteva 19B, San Miguel Chapultepec, CDMX",zona:"SAN MIGUEL CHAPULTEPEC",estado:"NUEVO",score:563,intentos:0,notas:"",vendedor:"VEND-001",seguimiento:false,tipoAccion:"",proximaAccion:"",labActual:"",resultadoVisita:"",waOptIn:false,waNumero:"",fechaCita:"",horaCita:"",objecion:"",clinicaDigital:""},
  {id:"PRO-0003",nombre:"Fundación Mil Sonrisas",doctor:"Dr. García",telefono:"+525598765432",email:"",direccion:"Av. Juárez 15, Centro Histórico, CDMX",zona:"CUAUHTEMOC",estado:"VISITADO_INTERESADO",score:485,intentos:1,notas:"Muy interesado, 3 sillones",vendedor:"VEND-001",seguimiento:true,tipoAccion:"WHATSAPP",proximaAccion:fmt(addDays(today,1)),labActual:"Lab Express",resultadoVisita:"INTERESADO",waOptIn:true,waNumero:"+525598765432",fechaCita:"",horaCita:"",objecion:"PRECIO",clinicaDigital:"DIGITAL"},
  {id:"PRO-0004",nombre:"La Clínica Dental Roma",doctor:"Dr. Soto",telefono:"+525512345678",email:"",direccion:"Av. Ámsterdam 45, Condesa, CDMX",zona:"CONDESA Y ROMA",estado:"CITA_AGENDADA",score:455,intentos:1,notas:"Cita confirmada",vendedor:"VEND-001",seguimiento:false,tipoAccion:"VISITA",proximaAccion:fmt(today),labActual:"",resultadoVisita:"",waOptIn:false,waNumero:"",fechaCita:fmt(today),horaCita:"10:00",objecion:"",clinicaDigital:"IMPRESIONES"},
  {id:"PRO-0005",nombre:"Smile Plus Polanco",doctor:"Dra. Vargas",telefono:"+525544332211",email:"",direccion:"Presidente Masaryk 111, Polanco, CDMX",zona:"POLANCO",estado:"CITA_AGENDADA",score:442,intentos:1,notas:"",vendedor:"VEND-001",seguimiento:false,tipoAccion:"VISITA",proximaAccion:fmt(today),labActual:"",resultadoVisita:"",waOptIn:true,waNumero:"",fechaCita:fmt(today),horaCita:"12:30",objecion:"",clinicaDigital:""},
  {id:"PRO-0006",nombre:"Dentech Popotla",doctor:"",telefono:"+525587654321",email:"",direccion:"Calle Popotla 23, Popotla, CDMX",zona:"POPOTLA",estado:"NUEVO",score:435,intentos:0,notas:"",vendedor:"VEND-001",seguimiento:false,tipoAccion:"",proximaAccion:"",labActual:"",resultadoVisita:"",waOptIn:false,waNumero:"",fechaCita:"",horaCita:"",objecion:"",clinicaDigital:""},
  {id:"PRO-0009",nombre:"OdontoPlus Condesa",doctor:"Dra. Reyes",telefono:"+525533221100",email:"",direccion:"Calle Veracruz 45, Condesa, CDMX",zona:"CONDESA Y ROMA",estado:"CITA_AGENDADA",score:350,intentos:1,notas:"",vendedor:"VEND-001",seguimiento:false,tipoAccion:"VISITA",proximaAccion:fmt(today),labActual:"",resultadoVisita:"",waOptIn:false,waNumero:"",fechaCita:fmt(today),horaCita:"15:00",objecion:"",clinicaDigital:""},
  {id:"PRO-0008",nombre:"Centro Dental Narvarte",doctor:"Dr. Mendoza",telefono:"+525566778899",email:"",direccion:"Eje 5 Sur 120, Narvarte, CDMX",zona:"NARVARTE",estado:"VISITADO_INTERESADO",score:367,intentos:1,notas:"Quiere cotización implantes",vendedor:"VEND-001",seguimiento:true,tipoAccion:"LLAMADA",proximaAccion:fmt(addDays(today,2)),labActual:"",resultadoVisita:"NECESITA_PENSAR",waOptIn:false,waNumero:"",fechaCita:"",horaCita:"",objecion:"FUTURA_LABS",clinicaDigital:"DIGITAL"},
];

const INIT_PLAN = {
  [W0]:{semana:W0,LUNES:"POLANCO",MARTES:"POLANCO",MIÉRCOLES:"CONDESA Y ROMA",JUEVES:"CONDESA Y ROMA",VIERNES:"NARVARTE",locked:true},
  [W1]:{semana:W1,LUNES:"SANTA FE",MARTES:"SATELITE",MIÉRCOLES:"DEL VALLE",JUEVES:"NARVARTE",VIERNES:"COYOACAN",locked:false},
  [W2]:{semana:W2,LUNES:"",MARTES:"",MIÉRCOLES:"",JUEVES:"",VIERNES:"",locked:false},
};

// ── SMALL COMPONENTS ──────────────────────────────────────────
function StatusBadge({estado,small}){
  const c=ESTADO_CONFIG[estado]||{color:"#64748B",bg:"#F8FAFC",label:estado};
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:small?"2px 8px":"4px 10px",borderRadius:20,fontSize:small?10:11,fontWeight:700,color:c.color,backgroundColor:c.bg,border:`1px solid ${c.color}30`,whiteSpace:"nowrap"}}><span style={{width:6,height:6,borderRadius:"50%",backgroundColor:c.color,flexShrink:0}}/>{c.label}</span>;
}
function ScoreBadge({score}){
  const color=score>400?"#059669":score>200?"#D97706":"#64748B";
  const bg=score>400?"#D1FAE5":score>200?"#FEF3C7":"#F8FAFC";
  return <span style={{padding:"2px 8px",borderRadius:12,fontSize:11,fontWeight:700,color,backgroundColor:bg}}>★ {Math.round(score)}</span>;
}
function Avatar({name,size=32}){
  const i=name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return <div style={{width:size,height:size,borderRadius:"50%",background:"linear-gradient(135deg,#0EA5E9,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.35,fontWeight:700,color:"white",flexShrink:0}}>{i}</div>;
}
function Toast({message,type,onClose}){
  useEffect(()=>{const t=setTimeout(onClose,4000);return()=>clearTimeout(t);},[onClose]);
  const c={success:"#10B981",error:"#EF4444",info:"#0EA5E9",warning:"#F59E0B"};
  return <div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",backgroundColor:c[type]||c.info,color:"white",padding:"12px 20px",borderRadius:12,fontSize:14,fontWeight:600,boxShadow:"0 8px 32px rgba(0,0,0,0.25)",zIndex:9999,maxWidth:340,textAlign:"center",animation:"slideUp .3s ease"}}>{message}</div>;
}

// ── NOTIFICATION PANEL ─────────────────────────────────────────
function NotifPanel({notifications,onDismiss,onClose}){
  return(
    <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.5)",zIndex:2000,display:"flex",alignItems:"flex-start",justifyContent:"flex-end"}} onClick={onClose}>
      <div style={{width:300,height:"100%",background:"white",boxShadow:"-8px 0 32px rgba(0,0,0,0.15)",overflowY:"auto",padding:16}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:700}}>Notificaciones</div>
          <button onClick={onClose} style={{background:"#F1F5F9",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer"}}>✕</button>
        </div>
        {notifications.length===0
          ?<div style={{textAlign:"center",padding:"40px 20px",color:"#94A3B8"}}><div style={{fontSize:32}}>🔔</div><div style={{fontSize:14,marginTop:8}}>Sin notificaciones</div></div>
          :notifications.map(n=>(
            <div key={n.id} style={{padding:"12px",background:n.read?"#F8FAFC":"#EFF6FF",borderRadius:12,marginBottom:8,border:`1px solid ${n.read?"#F1F5F9":"#BAE6FD"}`}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#0F172A",marginBottom:4}}>{n.icon} {n.title}</div>
                  <div style={{fontSize:12,color:"#64748B"}}>{n.body}</div>
                  <div style={{fontSize:11,color:"#94A3B8",marginTop:4}}>{n.time}</div>
                </div>
                <button onClick={()=>onDismiss(n.id)} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:14,padding:"0 0 0 8px"}}>✕</button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ── CALL MODAL ─────────────────────────────────────────────────
function CallModal({prospecto,plan,onClose,onCallDirect,onCallSystem}){
  const [sel,setSel]=useState("direct");
  const [enZona,setEnZona]=useState(false);
  const DIAS=["LUNES","MARTES","MIÉRCOLES","JUEVES","VIERNES"];
  const diasConZona=DIAS.filter(d=>plan?.[d]===prospecto.zona);

  return(
    <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.6)",zIndex:1500,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 16px"}} onClick={onClose}>
      <div style={{background:"white",borderRadius:20,padding:24,width:"100%",maxWidth:400}} onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:36,marginBottom:8}}>📞</div>
          <div style={{fontSize:17,fontWeight:700}}>{prospecto.nombre}</div>
          <div style={{fontSize:13,color:"#64748B",marginTop:4}}>{prospecto.zona} · {prospecto.telefono}</div>
        </div>

        <div style={{marginBottom:16}}>
          {[
            {id:"direct",icon:"📲",title:"Llamar yo ahora",desc:"Tu teléfono marca directamente",color:"#0EA5E9"},
            {id:"system_now",icon:"🤖",title:"Ana llama ahora",desc:"El sistema llama y agenda cita",color:"#8B5CF6"},
            {id:"system_zone",icon:"📅",title:"Ana llama para día de zona",desc:diasConZona.length>0?`${prospecto.zona} = ${diasConZona.join(", ")}`:"Zona sin asignar esta semana",color:"#10B981"},
          ].map(opt=>(
            <div key={opt.id} onClick={()=>setSel(opt.id)} style={{padding:"12px",border:`2px solid ${sel===opt.id?opt.color:"#E2E8F0"}`,borderRadius:12,marginBottom:8,cursor:"pointer",background:sel===opt.id?opt.color+"10":"white"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:22}}>{opt.icon}</span>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:"#0F172A"}}>{opt.title}</div>
                  <div style={{fontSize:12,color:"#64748B"}}>{opt.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(sel==="system_now"||sel==="system_zone")&&(
          <div style={{padding:"10px 12px",background:"#F5F3FF",borderRadius:10,marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
            <input type="checkbox" id="enZona" checked={enZona} onChange={e=>setEnZona(e.target.checked)} style={{width:18,height:18,cursor:"pointer"}}/>
            <label htmlFor="enZona" style={{fontSize:13,fontWeight:600,color:"#7C3AED",cursor:"pointer"}}>
              📍 Estoy en la zona ahora — Ana puede ofrecer visita inmediata
            </label>
          </div>
        )}

        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"12px",background:"#F1F5F9",border:"none",borderRadius:12,fontSize:14,fontWeight:600,cursor:"pointer",color:"#64748B"}}>Cancelar</button>
          <button onClick={()=>{
            if(sel==="direct") onCallDirect();
            else onCallSystem(sel==="system_now"?"now":"zone",enZona);
            onClose();
          }} style={{flex:2,padding:"12px",background:sel==="direct"?"#0EA5E9":sel==="system_now"?"#8B5CF6":"#10B981",border:"none",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",color:"white"}}>
            {sel==="direct"?"📲 Llamar":sel==="system_now"?"🤖 Enviar a Ana":"📅 Agendar por zona"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PROSPECTO MODAL ────────────────────────────────────────────
function ProspectoModal({p,onClose,onUpdate,onToast,plan,addNotif}){
  const [tab,setTab]=useState("info");
  const [showCall,setShowCall]=useState(false);
  const [form,setForm]=useState({
    resultadoVisita:p.resultadoVisita||"",
    notas:p.notas||"",
    labActual:p.labActual||"",
    objecion:p.objecion||"",
    clinicaDigital:p.clinicaDigital||"",
    waOptIn:p.waOptIn||false,
    tipoAccion:p.tipoAccion||"",
    proximaAccion:p.proximaAccion||"",
    nombreDoctor:p.doctor||"",
    fechaCompromiso:p.fechaCompromiso||"",
  });

  const save=()=>{
    onUpdate(p.id,{
      resultadoVisita:form.resultadoVisita,notas:form.notas,
      labActual:form.labActual,objecion:form.objecion,
      clinicaDigital:form.clinicaDigital,doctor:form.nombreDoctor,
      waOptIn:form.waOptIn,tipoAccion:form.tipoAccion,
      proximaAccion:form.proximaAccion,fechaCompromiso:form.fechaCompromiso,
      estado:form.resultadoVisita==="INTERESADO"?"VISITADO_INTERESADO":form.resultadoVisita==="NO_INTERESADO"?"VISITADO_NO_INTERESADO":p.estado,
      seguimiento:form.resultadoVisita==="INTERESADO",
    });
    onToast("✅ Guardado","success");
    onClose();
  };

  const inp={width:"100%",padding:"10px 12px",border:"1.5px solid #E2E8F0",borderRadius:10,fontSize:14,outline:"none",boxSizing:"border-box"};
  const lbl={fontSize:12,color:"#64748B",marginBottom:4,display:"block",fontWeight:600};

  return(
    <>
      <div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
        <div style={{width:"100%",maxWidth:480,margin:"0 auto",backgroundColor:"#fff",borderRadius:"20px 20px 0 0",maxHeight:"92vh",overflow:"hidden",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
          
          {/* Header */}
          <div style={{padding:"20px 20px 0",borderBottom:"1px solid #F1F5F9",flexShrink:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div style={{flex:1,marginRight:12}}>
                <div style={{fontSize:17,fontWeight:700,color:"#0F172A",marginBottom:4}}>{p.nombre}</div>
                <div style={{fontSize:13,color:"#64748B",marginBottom:8}}>{p.zona}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <StatusBadge estado={p.estado} small/>
                  <ScoreBadge score={p.score}/>
                  {p.clinicaDigital&&<span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:12,background:p.clinicaDigital==="DIGITAL"?"#EDE9FE":"#FEF3C7",color:p.clinicaDigital==="DIGITAL"?"#7C3AED":"#92400E"}}>{p.clinicaDigital==="DIGITAL"?"🖥️ Digital":"📷 Impresiones"}</span>}
                </div>
              </div>
              <button onClick={onClose} style={{background:"#F1F5F9",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:16,color:"#64748B"}}>✕</button>
            </div>
            <div style={{display:"flex",gap:8,paddingBottom:16}}>
              <button onClick={()=>setShowCall(true)} style={{flex:1,padding:"10px 0",background:"#EFF6FF",color:"#0EA5E9",border:"1.5px solid #BAE6FD",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer"}}>📞 Llamar</button>
              <button onClick={()=>{const n=(p.waNumero||p.telefono).replace("+","");window.open(`https://wa.me/${n}`,"_blank");}} style={{flex:1,padding:"10px 0",background:"#F0FDF4",color:"#10B981",border:"1.5px solid #A7F3D0",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer"}}>💬 WA</button>
              <button onClick={()=>window.open(`https://maps.google.com/?q=${encodeURIComponent(p.direccion)}`,"_blank")} style={{flex:1,padding:"10px 0",background:"#F5F3FF",color:"#8B5CF6",border:"1.5px solid #DDD6FE",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer"}}>🗺️ Maps</button>
            </div>
            <div style={{display:"flex"}}>
              {["info","visita","seguimiento"].map(t=>(
                <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"10px 0",background:"none",border:"none",borderBottom:`2px solid ${tab===t?"#0EA5E9":"transparent"}`,fontSize:13,fontWeight:600,cursor:"pointer",color:tab===t?"#0EA5E9":"#94A3B8"}}>
                  {t==="info"?"Info":t==="visita"?"Registrar":"Seguimiento"}
                </button>
              ))}
            </div>
          </div>

          <div style={{flex:1,overflowY:"auto",padding:20}}>
            {tab==="info"&&(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {[["📞","Teléfono",p.telefono],["📧","Email",p.email||"—"],["📍","Dirección",p.direccion],["🏥","Lab actual",p.labActual||"—"],["👤","Doctor",p.doctor||"—"],["🔄","Intentos",p.intentos||0],["📝","Notas",p.notas||"—"]].map(([icon,label,value])=>(
                  <div key={label} style={{padding:"10px 14px",background:"#F8FAFC",borderRadius:10}}>
                    <div style={{fontSize:11,color:"#94A3B8",marginBottom:2}}>{icon} {label}</div>
                    <div style={{fontSize:14,color:"#0F172A",wordBreak:"break-word"}}>{value}</div>
                  </div>
                ))}
                {p.objecion&&<div style={{padding:"10px 14px",background:"#FFFBEB",borderRadius:10,border:"1px solid #FCD34D"}}>
                  <div style={{fontSize:11,color:"#92400E",marginBottom:2}}>⚠️ Objeción registrada</div>
                  <div style={{fontSize:14,color:"#92400E",fontWeight:600}}>{OBJECIONES.find(o=>o.value===p.objecion)?.label||p.objecion}</div>
                </div>}
              </div>
            )}

            {tab==="visita"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {/* Resultado */}
                <div>
                  <label style={lbl}>Resultado de la visita</label>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {RESULTADO_VISITA.map(r=>(
                      <button key={r.value} onClick={()=>setForm(f=>({...f,resultadoVisita:r.value}))} style={{padding:"10px 8px",border:`2px solid ${form.resultadoVisita===r.value?r.color:"#E2E8F0"}`,borderRadius:10,background:form.resultadoVisita===r.value?r.color+"15":"white",fontSize:12,fontWeight:600,cursor:"pointer",color:form.resultadoVisita===r.value?r.color:"#64748B"}}>
                        {r.icon} {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Objeción */}
                <div>
                  <label style={lbl}>Objeción principal (si hubo)</label>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                    {OBJECIONES.map(o=>(
                      <button key={o.value} onClick={()=>setForm(f=>({...f,objecion:f.objecion===o.value?"":o.value}))} style={{padding:"8px",border:`2px solid ${form.objecion===o.value?"#F59E0B":"#E2E8F0"}`,borderRadius:10,background:form.objecion===o.value?"#FFFBEB":"white",fontSize:11,fontWeight:600,cursor:"pointer",color:form.objecion===o.value?"#92400E":"#64748B",textAlign:"left"}}>
                        {o.icon} {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clínica digital */}
                <div>
                  <label style={lbl}>¿Cómo trabaja la clínica?</label>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                    {[{v:"DIGITAL",l:"Digital",i:"🖥️",c:"#7C3AED"},{v:"IMPRESIONES",l:"Impresiones",i:"📷",c:"#D97706"},{v:"AMBOS",l:"Ambos",i:"🔀",c:"#0EA5E9"}].map(opt=>(
                      <button key={opt.v} onClick={()=>setForm(f=>({...f,clinicaDigital:f.clinicaDigital===opt.v?"":opt.v}))} style={{padding:"10px 6px",border:`2px solid ${form.clinicaDigital===opt.v?opt.c:"#E2E8F0"}`,borderRadius:10,background:form.clinicaDigital===opt.v?opt.c+"15":"white",fontSize:11,fontWeight:600,cursor:"pointer",color:form.clinicaDigital===opt.v?opt.c:"#64748B",textAlign:"center"}}>
                        <div style={{fontSize:18,marginBottom:2}}>{opt.i}</div>{opt.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div><label style={lbl}>Nombre del doctor</label>
                  <input value={form.nombreDoctor} onChange={e=>setForm(f=>({...f,nombreDoctor:e.target.value}))} placeholder="Dr. ..." style={inp}/>
                </div>
                <div><label style={lbl}>Lab con el que trabajan hoy</label>
                  <input value={form.labActual} onChange={e=>setForm(f=>({...f,labActual:e.target.value}))} placeholder="Nombre del laboratorio..." style={inp}/>
                </div>
                <div><label style={lbl}>Notas de la visita</label>
                  <textarea value={form.notas} onChange={e=>setForm(f=>({...f,notas:e.target.value}))} placeholder="Observaciones, intereses..." rows={3} style={{...inp,resize:"none"}}/>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:"#F0FDF4",borderRadius:10}}>
                  <input type="checkbox" id="wa" checked={form.waOptIn} onChange={e=>setForm(f=>({...f,waOptIn:e.target.checked}))} style={{width:18,height:18,cursor:"pointer"}}/>
                  <label htmlFor="wa" style={{fontSize:13,color:"#065F46",fontWeight:600,cursor:"pointer"}}>✅ Aceptó recibir WhatsApp</label>
                </div>
                <button onClick={save} style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#0EA5E9,#8B5CF6)",color:"white",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer"}}>Guardar Visita</button>
              </div>
            )}

            {tab==="seguimiento"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div>
                  <label style={lbl}>Próxima acción</label>
                  <div style={{display:"flex",gap:8}}>
                    <select value={form.tipoAccion} onChange={e=>setForm(f=>({...f,tipoAccion:e.target.value}))} style={{...inp,flex:1}}>
                      <option value="">Tipo...</option>
                      {["LLAMADA","WHATSAPP","EMAIL","VISITA","ESPERAR"].map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                    <input type="date" value={form.proximaAccion} onChange={e=>setForm(f=>({...f,proximaAccion:e.target.value}))} style={{...inp,flex:1}}/>
                  </div>
                </div>
                <div><label style={lbl}>Fecha compromiso del doctor</label>
                  <input type="date" value={form.fechaCompromiso} onChange={e=>setForm(f=>({...f,fechaCompromiso:e.target.value}))} style={inp}/>
                </div>
                <button onClick={save} style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#10B981,#0EA5E9)",color:"white",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer"}}>Guardar Seguimiento</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCall&&<CallModal prospecto={p} plan={INIT_PLAN[W0]} onClose={()=>setShowCall(false)}
        onCallDirect={()=>window.open(`tel:${p.telefono}`,"_self")}
        onCallSystem={async(mode,enZona)=>{
          onToast(enZona?"🤖 Ana ofrece visita inmediata...":"🤖 Ana está llamando...","info");
          try {
            await fetch(CONFIG.MAKE_WEBHOOK_E5,{
              method:"POST",
              headers:{"Content-Type":"application/json"},
              body:JSON.stringify({zona:p.zona,id_vendedor:CONFIG.CURRENT_USER.id,max_llamadas:1,vendedora_en_zona:enZona})
            });
            addNotif({id:Date.now(),icon:"🤖",title:"Ana llamó a "+p.nombre,body:enZona?"Ana ofreció que puedes pasar hoy mismo.":"Ana intentará agendar cita.",time:"Ahora mismo",read:false});
          } catch(e){
            onToast("⚠️ Error de conexión","error");
          }
        }}/>}
    </>
  );
}

// ── VIEW: MAPA DEL DÍA ─────────────────────────────────────────
function MapaDelDia({prospectos,onSelect,onToast,addNotif}){
  const citasHoy=prospectos.filter(p=>p.estado==="CITA_AGENDADA"&&p.fechaCita===fmt(today)).sort((a,b)=>(a.horaCita||"").localeCompare(b.horaCita||""));
  const zonas=[...new Set(prospectos.filter(p=>p.estado!=="CLIENTE_ACTIVO"&&p.estado!=="DESCARTADO").map(p=>p.zona))].slice(0,6);

  return(
    <div style={{height:"100%",overflowY:"auto",padding:"0 0 80px"}}>
      <div style={{padding:"16px 16px 8px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <div style={{fontSize:15,fontWeight:700,color:"#0F172A"}}>Citas de hoy</div>
          <span style={{background:"#D1FAE5",color:"#059669",borderRadius:12,padding:"2px 8px",fontSize:12,fontWeight:700}}>{citasHoy.length} citas</span>
          <div style={{fontSize:12,color:"#64748B",marginLeft:"auto"}}>{today.toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"})}</div>
        </div>
        {citasHoy.length===0
          ?<div style={{padding:"20px",background:"#F8FAFC",borderRadius:14,textAlign:"center",color:"#94A3B8"}}><div style={{fontSize:24,marginBottom:6}}>📅</div><div style={{fontSize:13}}>No hay citas para hoy</div></div>
          :<div style={{position:"relative",paddingLeft:28}}>
            <div style={{position:"absolute",left:10,top:20,bottom:20,width:2,background:"linear-gradient(180deg,#0EA5E9,#8B5CF6)",borderRadius:2}}/>
            {citasHoy.map(c=>(
              <div key={c.id} onClick={()=>onSelect(c)} style={{marginBottom:12,cursor:"pointer",position:"relative"}}>
                <div style={{position:"absolute",left:-18,width:16,height:16,borderRadius:"50%",background:"#0EA5E9",border:"3px solid white",boxShadow:"0 0 0 2px #0EA5E9",marginTop:16}}/>
                <div style={{padding:"12px 14px",background:"white",borderRadius:12,boxShadow:"0 2px 8px rgba(0,0,0,0.08)",border:"1.5px solid #E0F2FE"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:"#0F172A"}}>{c.nombre}</div>
                      <div style={{fontSize:12,color:"#64748B",marginTop:2}}>{c.doctor||"Doctor no registrado"} · {c.zona}</div>
                      <div style={{fontSize:12,color:"#94A3B8",marginTop:2}}>📍 {c.direccion?.split(",").slice(0,2).join(",")}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0,marginLeft:10}}>
                      <div style={{fontSize:22,fontWeight:800,color:"#0EA5E9"}}>{c.horaCita||"—"}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        }
      </div>

      {/* Mapa */}
      <div style={{margin:"8px 16px",borderRadius:16,overflow:"hidden",border:"1.5px solid #E2E8F0",position:"relative",height:180,background:"linear-gradient(135deg,#E8F5E9,#E3F2FD)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center",color:"#64748B"}}>
          <div style={{fontSize:28,marginBottom:6}}>🗺️</div>
          <div style={{fontSize:13,fontWeight:600}}>Mapa de citas del día</div>
          <div style={{fontSize:12}}>Conectar Google Maps API</div>
        </div>
        {citasHoy.map((c,i)=>(
          <div key={c.id} style={{position:"absolute",top:`${15+i*25}%`,left:`${15+i*22}%`,background:"#10B981",color:"white",borderRadius:"50% 50% 50% 0",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,boxShadow:"0 2px 8px rgba(0,0,0,0.3)",transform:"rotate(-45deg)"}}>
            <span style={{transform:"rotate(45deg)"}}>{c.horaCita?.split(":")[0]||i+1}</span>
          </div>
        ))}
      </div>

      {/* Llamar por zona */}
      <div style={{padding:"12px 16px"}}>
        <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:10}}>Pedir a Ana que llame por zona</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {zonas.map(zona=>{
            const count=prospectos.filter(p=>p.zona===zona&&["NUEVO","LLAMADA_PENDIENTE"].includes(p.estado)).length;
            return(
              <button key={zona} onClick={async()=>{
  onToast(`🤖 Enviando llamadas en ${zona}...`,"info");
  try {
    const res = await fetch(CONFIG.MAKE_WEBHOOK_E5, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({zona, id_vendedor:CONFIG.CURRENT_USER.id, max_llamadas:3})
    });
    if(res.ok){
      onToast(`✅ Ana llamando en ${zona}`,"success");
      addNotif({id:Date.now(),icon:"🤖",title:`Llamadas iniciadas en ${zona}`,body:"Ana está contactando prospectos. Te avisamos cuando haya citas.",time:"Ahora mismo",read:false});
    } else {
      onToast("⚠️ Error al contactar Make","error");
    }
  } catch(e) {
    onToast("⚠️ Error de conexión","error");
  }
}} style={{padding:"10px 12px",background:"white",border:"1.5px solid #E2E8F0",borderRadius:12,cursor:"pointer",textAlign:"left",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                <div style={{fontSize:12,fontWeight:700,color:"#0F172A"}}>{zona}</div>
                <div style={{fontSize:11,color:"#64748B",marginTop:2}}>{count} disponibles</div>
                <div style={{fontSize:10,color:"#8B5CF6",marginTop:4,fontWeight:600}}>🤖 Que Ana llame →</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── VIEW: LISTA ─────────────────────────────────────────────────
function ListaDelDia({prospectos,onSelect}){
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("TODOS");
  const QUICK=["TODOS","NUEVO","CITA_AGENDADA","VISITADO_INTERESADO","LLAMADA_PENDIENTE"];
  const filtered=prospectos
    .filter(p=>p.vendedor===CONFIG.CURRENT_USER.id&&p.estado!=="CLIENTE_ACTIVO"&&p.estado!=="DESCARTADO")
    .filter(p=>!search||p.nombre.toLowerCase().includes(search.toLowerCase())||p.zona.toLowerCase().includes(search.toLowerCase()))
    .filter(p=>filter==="TODOS"||p.estado===filter)
    .sort((a,b)=>b.score-a.score);
  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"12px 16px 0"}}>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:15}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar clínica o zona..." style={{width:"100%",padding:"10px 12px 10px 38px",border:"1.5px solid #E2E8F0",borderRadius:12,fontSize:14,outline:"none",boxSizing:"border-box",background:"#F8FAFC"}}/>
        </div>
      </div>
      <div style={{padding:"10px 16px",display:"flex",gap:6,overflowX:"auto"}}>
        {QUICK.map(f=>{
          const c=ESTADO_CONFIG[f];
          return <button key={f} onClick={()=>setFilter(f)} style={{padding:"6px 12px",borderRadius:20,border:`1.5px solid ${filter===f?(c?.color||"#0EA5E9"):"#E2E8F0"}`,background:filter===f?(c?.bg||"#EFF6FF"):"white",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",color:filter===f?(c?.color||"#0EA5E9"):"#94A3B8"}}>
            {c?.label||"Todos"}
          </button>;
        })}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"0 16px 80px"}}>
        {filtered.map(p=>(
          <div key={p.id} onClick={()=>onSelect(p)} style={{padding:"14px",background:"white",borderRadius:14,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",cursor:"pointer",border:"1.5px solid #F1F5F9"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div style={{flex:1,marginRight:8}}>
                <div style={{fontSize:15,fontWeight:700,color:"#0F172A",marginBottom:2}}>{p.nombre}</div>
                <div style={{fontSize:12,color:"#64748B"}}>📍 {p.zona} {p.doctor&&`· ${p.doctor}`}</div>
              </div>
              <ScoreBadge score={p.score}/>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:4}}>
              <StatusBadge estado={p.estado} small/>
              <div style={{display:"flex",gap:4}}>
                {p.clinicaDigital&&<span style={{fontSize:10,padding:"2px 6px",borderRadius:8,background:p.clinicaDigital==="DIGITAL"?"#EDE9FE":"#FEF3C7",color:p.clinicaDigital==="DIGITAL"?"#7C3AED":"#92400E"}}>{p.clinicaDigital==="DIGITAL"?"🖥️":"📷"}</span>}
                {p.fechaCita===fmt(today)&&p.horaCita&&<span style={{fontSize:11,fontWeight:700,color:"#10B981",background:"#ECFDF5",padding:"3px 8px",borderRadius:8}}>🕐 {p.horaCita}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── VIEW: CHECKLIST ─────────────────────────────────────────────
function Checklist({prospectos,onSelect,onUpdate,onToast}){
  const pend=prospectos.filter(p=>p.estado==="VISITADO_INTERESADO"&&!p.seguimiento&&p.vendedor===CONFIG.CURRENT_USER.id).sort((a,b)=>new Date(a.proximaAccion||"9999")-new Date(b.proximaAccion||"9999"));
  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"16px 16px 8px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{fontSize:15,fontWeight:700}}>Seguimiento pendiente</div>
          <span style={{background:"#FEE2E2",color:"#EF4444",borderRadius:12,padding:"2px 8px",fontSize:12,fontWeight:700}}>{pend.length}</span>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"0 16px 80px"}}>
        {pend.length===0
          ?<div style={{textAlign:"center",padding:"60px 20px",color:"#94A3B8"}}><div style={{fontSize:40,marginBottom:12}}>🎉</div><div style={{fontSize:15,fontWeight:600}}>¡Todo al día!</div></div>
          :pend.map(p=>{
            const urgent=p.proximaAccion&&new Date(p.proximaAccion+"T12:00:00")<=new Date();
            const obj=OBJECIONES.find(o=>o.value===p.objecion);
            return(
              <div key={p.id} onClick={()=>onSelect(p)} style={{padding:"14px",background:urgent?"#FFFBFB":"white",borderRadius:14,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",cursor:"pointer",border:`1.5px solid ${urgent?"#FEE2E2":"#F1F5F9"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:700}}>{p.nombre}</div>
                    <div style={{fontSize:12,color:"#64748B",marginTop:2}}>
                      {p.tipoAccion==="WHATSAPP"?"💬":p.tipoAccion==="LLAMADA"?"📞":"🏥"} {p.tipoAccion||"Acción pendiente"}
                      {p.proximaAccion&&` · ${new Date(p.proximaAccion+"T12:00:00").toLocaleDateString("es-MX",{weekday:"short",day:"numeric",month:"short"})}`}
                    </div>
                    {obj&&<div style={{fontSize:11,color:"#92400E",background:"#FEF3C7",padding:"2px 6px",borderRadius:6,display:"inline-block",marginTop:4}}>{obj.icon} {obj.label}</div>}
                  </div>
                  {urgent&&<span style={{fontSize:10,fontWeight:700,color:"#EF4444",background:"#FEE2E2",padding:"3px 8px",borderRadius:8,height:"fit-content"}}>HOY</span>}
                </div>
                {p.notas&&<div style={{fontSize:12,color:"#64748B",marginBottom:8,fontStyle:"italic",background:"#F8FAFC",padding:"6px 10px",borderRadius:8}}>"{p.notas}"</div>}
                <div style={{display:"flex",gap:8}}>
                  <button onClick={e=>{e.stopPropagation();window.open(`https://wa.me/${(p.waNumero||p.telefono).replace("+","")}`,"_blank");}} style={{flex:1,padding:"8px 0",background:"#F0FDF4",color:"#10B981",border:"1.5px solid #A7F3D0",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>💬 WhatsApp</button>
                  <button onClick={e=>{e.stopPropagation();onUpdate(p.id,{seguimiento:true});onToast("✅ Completado","success");}} style={{flex:1,padding:"8px 0",background:"#EFF6FF",color:"#0EA5E9",border:"1.5px solid #BAE6FD",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>✅ Hecho</button>
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

// ── VIEW: PLAN SEMANAL (3 semanas) ─────────────────────────────
function PlanSemanal({prospectos,onToast}){
  const WEEKS=[{key:W0,label:"Esta semana",short:"W0"},{key:W1,label:"Próx. semana",short:"W1"},{key:W2,label:"En 2 semanas",short:"W2"}];
  const [active,setActive]=useState(W1);
  const [plan,setPlan]=useState(INIT_PLAN);
  const DIAS=["LUNES","MARTES","MIÉRCOLES","JUEVES","VIERNES"];
  const getCount=zona=>prospectos.filter(p=>p.zona===zona&&p.estado!=="CLIENTE_ACTIVO"&&p.estado!=="DESCARTADO").length;
  const getCitas=zona=>prospectos.filter(p=>p.zona===zona&&p.estado==="CITA_AGENDADA").length;

  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column"}}>
      {/* 3 tabs */}
      <div style={{display:"flex",borderBottom:"1px solid #F1F5F9",background:"white",flexShrink:0}}>
        {WEEKS.map(w=>(
          <button key={w.key} onClick={()=>setActive(w.key)} style={{flex:1,padding:"12px 4px",background:"none",border:"none",borderBottom:`2px solid ${active===w.key?"#0EA5E9":"transparent"}`,fontSize:12,fontWeight:700,cursor:"pointer",color:active===w.key?"#0EA5E9":"#94A3B8"}}>
            {w.label}
            {w.key===W0&&<div style={{fontSize:9,color:"#10B981",marginTop:2}}>🔒 Agendado</div>}
          </button>
        ))}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"12px 16px 80px"}}>
        {/* Lock notice for current week */}
        {active===W0&&(
          <div style={{padding:"12px 14px",background:"#F0FDF4",border:"1.5px solid #A7F3D0",borderRadius:12,marginBottom:14,display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:24,flexShrink:0}}>🔒</span>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#065F46"}}>Semana en curso — solo lectura</div>
              <div style={{fontSize:12,color:"#065F46",marginTop:2}}>Las citas ya están agendadas. Puedes ver el plan pero no modificarlo.</div>
            </div>
          </div>
        )}

        {/* Advance week banner on Fridays */}
        {active===W1&&today.getDay()===5&&(
          <div style={{padding:"12px 14px",background:"#FFFBEB",border:"1.5px solid #FCD34D",borderRadius:12,marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700,color:"#92400E"}}>¡Es viernes! Avanza el plan 📅</div>
            <div style={{fontSize:12,color:"#92400E",marginTop:4}}>Mañana la próxima semana se convierte en esta semana.</div>
            <button onClick={()=>{setPlan(prev=>({[W0]:{...prev[W1]},Deleted:[W1],Added:{[W1]:{...prev[W2]},[W2]:{semana:W2,LUNES:"",MARTES:"",MIÉRCOLES:"",JUEVES:"",VIERNES:"",locked:false}}}));onToast("✅ Plan avanzado","success");setActive(W0);}} style={{marginTop:8,padding:"6px 14px",background:"#F59E0B",color:"white",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>
              Avanzar plan →
            </button>
          </div>
        )}

        {DIAS.map(dia=>{
          const zona=plan[active]?.[dia]||"";
          const locked=active===W0;
          return(
            <div key={dia} style={{marginBottom:10,background:"white",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",opacity:locked?0.85:1}}>
              <div style={{padding:"10px 14px",background:locked?"#F0FDF4":"#F8FAFC",borderBottom:"1px solid #F1F5F9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#0F172A"}}>{dia}</div>
                <div style={{display:"flex",gap:6}}>
                  {zona&&<span style={{fontSize:11,color:"#64748B",background:"#F1F5F9",padding:"2px 8px",borderRadius:8}}>{getCount(zona)} prospects</span>}
                  {zona&&getCitas(zona)>0&&<span style={{fontSize:11,color:"#10B981",background:"#ECFDF5",padding:"2px 8px",borderRadius:8,fontWeight:700}}>🟢 {getCitas(zona)} citas</span>}
                </div>
              </div>
              <div style={{padding:"10px 14px"}}>
                {locked
                  ?<div style={{padding:"8px 10px",background:"#F8FAFC",borderRadius:8,fontSize:13,color:"#0F172A",fontWeight:600}}>{zona||<span style={{color:"#94A3B8"}}>Sin zona asignada</span>}</div>
                  :<select value={zona} onChange={e=>setPlan(prev=>({...prev,[active]:{...prev[active],[dia]:e.target.value}}))} style={{width:"100%",padding:"8px 10px",border:"1.5px solid #E2E8F0",borderRadius:8,fontSize:13,outline:"none",background:"white"}}>
                    <option value="">Sin zona</option>
                    {ZONAS_LIST.map(z=><option key={z} value={z}>{z}</option>)}
                  </select>
                }
              </div>
            </div>
          );
        })}

        {!plan[active]?.locked&&(
          <button onClick={()=>onToast("💾 Plan guardado","success")} style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#0EA5E9,#8B5CF6)",color:"white",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",marginTop:4}}>
            💾 Guardar Plan
          </button>
        )}
      </div>
    </div>
  );
}

// ── VIEW: NUEVA CLINICA ─────────────────────────────────────────
function NuevaClinica({onToast,addNotif,prospectos}){
  const [mode,setMode]=useState("agregar"); // "agregar" | "visite"
  const [form,setForm]=useState({nombre:"",telefono:"",direccion:"",zona:"",notas:"",doctor:"",labActual:"",resultadoVisita:"",objecion:"",clinicaDigital:"",waOptIn:false,tipoAccion:"",proximaAccion:""});

  const inp={width:"100%",padding:"10px 12px",border:"1.5px solid #E2E8F0",borderRadius:10,fontSize:14,outline:"none",boxSizing:"border-box"};
  const lbl={fontSize:12,color:"#64748B",marginBottom:4,display:"block",fontWeight:600};

  const handleSave=(andCall=false)=>{
    if(!form.nombre||!form.telefono){onToast("⚠️ Nombre y teléfono requeridos","error");return;}
    onToast("✅ Clínica agregada","success");
    if(andCall){
      setTimeout(()=>{
        onToast("🤖 Ana está llamando a "+form.nombre,"info");
        addNotif({id:Date.now(),icon:"🤖",title:"Ana llamó a "+form.nombre,body:"Te avisamos cuando complete la llamada.",time:"Ahora mismo",read:false});
      },800);
    }
    setForm({nombre:"",telefono:"",direccion:"",zona:"",notas:"",doctor:"",labActual:"",resultadoVisita:"",objecion:"",clinicaDigital:"",waOptIn:false,tipoAccion:"",proximaAccion:""});
  };

  return(
    <div style={{height:"100%",overflowY:"auto",padding:"16px 16px 80px"}}>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:16,fontWeight:700,color:"#0F172A"}}>Nueva Clínica</div>
        <div style={{fontSize:13,color:"#64748B"}}>Encontré una clínica en el camino</div>
      </div>

      {/* Toggle: solo agregar vs ya visité */}
      <div style={{display:"flex",background:"#F1F5F9",borderRadius:12,padding:4,marginBottom:20}}>
        {[{v:"agregar",l:"Solo agregar",i:"➕"},{v:"visite",l:"Ya la visité",i:"🏥"}].map(opt=>(
          <button key={opt.v} onClick={()=>setMode(opt.v)} style={{flex:1,padding:"10px",background:mode===opt.v?"white":"transparent",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",color:mode===opt.v?"#0F172A":"#94A3B8",boxShadow:mode===opt.v?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>
            {opt.i} {opt.l}
          </button>
        ))}
      </div>

      {/* Datos básicos — siempre visibles */}
      <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
        <div><label style={lbl}>Nombre de la clínica *</label>
          <input value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} placeholder="Ej: Clínica Dental Polanco" style={inp}/>
        </div>
        <div><label style={lbl}>Teléfono *</label>
          <input value={form.telefono} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))} placeholder="+52 55 XXXX XXXX" type="tel" style={inp}/>
        </div>
        <div><label style={lbl}>Dirección</label>
          <input value={form.direccion} onChange={e=>setForm(f=>({...f,direccion:e.target.value}))} placeholder="Calle, Colonia" style={inp}/>
        </div>
        <div><label style={lbl}>Zona</label>
          <select value={form.zona} onChange={e=>setForm(f=>({...f,zona:e.target.value}))} style={inp}>
            <option value="">Selecciona zona...</option>
            {ZONAS_LIST.map(z=><option key={z} value={z}>{z}</option>)}
          </select>
        </div>
      </div>

      {/* Datos extendidos si ya visitó */}
      {mode==="visite"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12,padding:"16px",background:"#F8FAFC",borderRadius:14,marginBottom:16,border:"1.5px solid #E2E8F0"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#0F172A",marginBottom:4}}>📋 Datos de la visita</div>

          <div>
            <label style={lbl}>Resultado</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {RESULTADO_VISITA.map(r=>(
                <button key={r.value} onClick={()=>setForm(f=>({...f,resultadoVisita:r.value}))} style={{padding:"8px",border:`2px solid ${form.resultadoVisita===r.value?r.color:"#E2E8F0"}`,borderRadius:10,background:form.resultadoVisita===r.value?r.color+"15":"white",fontSize:11,fontWeight:600,cursor:"pointer",color:form.resultadoVisita===r.value?r.color:"#64748B"}}>
                  {r.icon} {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={lbl}>Objeción</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {OBJECIONES.slice(0,6).map(o=>(
                <button key={o.value} onClick={()=>setForm(f=>({...f,objecion:f.objecion===o.value?"":o.value}))} style={{padding:"6px 8px",border:`2px solid ${form.objecion===o.value?"#F59E0B":"#E2E8F0"}`,borderRadius:8,background:form.objecion===o.value?"#FFFBEB":"white",fontSize:10,fontWeight:600,cursor:"pointer",color:form.objecion===o.value?"#92400E":"#64748B",textAlign:"left"}}>
                  {o.icon} {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={lbl}>¿Clínica digital o impresiones?</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
              {[{v:"DIGITAL",l:"Digital",i:"🖥️"},{v:"IMPRESIONES",l:"Impresiones",i:"📷"},{v:"AMBOS",l:"Ambos",i:"🔀"}].map(opt=>(
                <button key={opt.v} onClick={()=>setForm(f=>({...f,clinicaDigital:f.clinicaDigital===opt.v?"":opt.v}))} style={{padding:"8px",border:`2px solid ${form.clinicaDigital===opt.v?"#0EA5E9":"#E2E8F0"}`,borderRadius:8,background:form.clinicaDigital===opt.v?"#EFF6FF":"white",fontSize:10,fontWeight:600,cursor:"pointer",textAlign:"center",color:form.clinicaDigital===opt.v?"#0EA5E9":"#64748B"}}>
                  <div style={{fontSize:16}}>{opt.i}</div>{opt.l}
                </button>
              ))}
            </div>
          </div>

          <div><label style={lbl}>Nombre del doctor</label>
            <input value={form.doctor} onChange={e=>setForm(f=>({...f,doctor:e.target.value}))} placeholder="Dr. ..." style={inp}/>
          </div>
          <div><label style={lbl}>Lab con el que trabajan</label>
            <input value={form.labActual} onChange={e=>setForm(f=>({...f,labActual:e.target.value}))} placeholder="Nombre del laboratorio..." style={inp}/>
          </div>
          <div><label style={lbl}>Notas</label>
            <textarea value={form.notas} onChange={e=>setForm(f=>({...f,notas:e.target.value}))} placeholder="Observaciones..." rows={2} style={{...inp,resize:"none"}}/>
          </div>
          <div>
            <label style={lbl}>Próxima acción</label>
            <div style={{display:"flex",gap:8}}>
              <select value={form.tipoAccion} onChange={e=>setForm(f=>({...f,tipoAccion:e.target.value}))} style={{...inp,flex:1}}>
                <option value="">Tipo...</option>
                {["LLAMADA","WHATSAPP","EMAIL","VISITA"].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              <input type="date" value={form.proximaAccion} onChange={e=>setForm(f=>({...f,proximaAccion:e.target.value}))} style={{...inp,flex:1}}/>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#F0FDF4",borderRadius:10}}>
            <input type="checkbox" id="waNew" checked={form.waOptIn} onChange={e=>setForm(f=>({...f,waOptIn:e.target.checked}))} style={{width:16,height:16,cursor:"pointer"}}/>
            <label htmlFor="waNew" style={{fontSize:12,color:"#065F46",fontWeight:600,cursor:"pointer"}}>✅ Aceptó recibir WhatsApp</label>
          </div>
        </div>
      )}

      <button onClick={()=>handleSave(false)} style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#10B981,#0EA5E9)",color:"white",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",marginBottom:10}}>
        {mode==="visite"?"🏥 Guardar Visita":"➕ Agregar al Sistema"}
      </button>

      {mode==="agregar"&&(
        <div style={{padding:"14px",background:"#F5F3FF",border:"1.5px solid #DDD6FE",borderRadius:12}}>
          <div style={{fontSize:13,fontWeight:700,color:"#7C3AED",marginBottom:6}}>🤖 Agregar y que Ana llame ahora</div>
          <div style={{fontSize:12,color:"#6D28D9",marginBottom:10}}>Ana intentará agendar una cita de inmediato.</div>
          <button onClick={()=>handleSave(true)} style={{width:"100%",padding:"12px",background:"#8B5CF6",color:"white",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>
            🤖 Agregar y Llamar con Ana
          </button>
        </div>
      )}

      {/* Prospectos cercanos en la zona */}
      {form.zona&&(()=>{
        const cercanos=prospectos.filter(p=>p.zona===form.zona&&["NUEVO","LLAMADA_PENDIENTE"].includes(p.estado)).slice(0,3);
        if(cercanos.length===0) return null;
        return(
          <div style={{marginTop:16}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Más prospectos en {form.zona}</div>
            {cercanos.map(p=>(
              <div key={p.id} style={{padding:"10px 12px",background:"white",borderRadius:10,marginBottom:8,border:"1.5px solid #E2E8F0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600}}>{p.nombre}</div>
                  <ScoreBadge score={p.score}/>
                </div>
                <button onClick={async()=>{
  try {
    await fetch(CONFIG.MAKE_WEBHOOK_E5,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({zona:p.zona,id_vendedor:CONFIG.CURRENT_USER.id,max_llamadas:1})});
    addNotif({id:Date.now(),icon:"🤖",title:"Ana llamó a "+p.nombre,body:"Te notificamos cuando termine.",time:"Ahora mismo",read:false});
  } catch(e){}
}} style={{padding:"6px 12px",background:"#8B5CF6",color:"white",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                  Ana llama
                </button>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────
export default function App(){
  const [view,setView]=useState("mapa");
  const [selected,setSelected]=useState(null);
  const [toast,setToast]=useState(null);
  const [showNotif,setShowNotif]=useState(false);
  const [notifs,setNotifs]=useState([
    {id:1,icon:"🤖",title:"Ana agendó cita en La Clínica Dental Roma",body:"Jueves 10am confirmado — Condesa y Roma",time:"Hace 5 min",read:false},
    {id:2,icon:"📅",title:"Plan semanal sincronizado",body:"Make actualizó los slots del calendario.",time:"Hace 1h",read:true},
  ]);
  const [prospectos,setProspectos]=useState(MOCK);

  const unread=notifs.filter(n=>!n.read).length;
  const citasHoy=prospectos.filter(p=>p.estado==="CITA_AGENDADA"&&p.fechaCita===fmt(today)).length;
  const checkCount=prospectos.filter(p=>p.estado==="VISITADO_INTERESADO"&&!p.seguimiento&&p.vendedor===CONFIG.CURRENT_USER.id).length;

  const showToast=useCallback((msg,type="info")=>setToast({message:msg,type}),[]);
  const addNotif=useCallback(n=>setNotifs(prev=>[n,...prev]),[]);
  const updateP=useCallback((id,u)=>setProspectos(prev=>prev.map(p=>p.id===id?{...p,...u}:p)),[]);
  const dismissN=useCallback(id=>setNotifs(prev=>prev.filter(n=>n.id!==id)),[]);

  // Request push notification permission
  useEffect(()=>{
    if("Notification" in window && Notification.permission==="default"){
      setTimeout(()=>Notification.requestPermission(),2000);
    }
  },[]);

  const VIEWS=[
    {id:"mapa",icon:"🗺️",label:"Hoy",badge:citasHoy},
    {id:"lista",icon:"📋",label:"Lista"},
    {id:"checklist",icon:"✅",label:"Check",badge:checkCount},
    {id:"plan",icon:"📅",label:"Plan"},
    {id:"nueva",icon:"➕",label:"Nueva"},
  ];

  return(
    <div style={{maxWidth:480,margin:"0 auto",height:"100dvh",display:"flex",flexDirection:"column",fontFamily:"'DM Sans','SF Pro Display',-apple-system,sans-serif",backgroundColor:"#F8FAFC",position:"relative",overflow:"hidden"}}>
      
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0F172A 0%,#1E293B 100%)",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,background:"linear-gradient(135deg,#0EA5E9,#8B5CF6)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"white"}}>AG</div>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:"white"}}>AltoGrado CRM</div>
            <div style={{fontSize:11,color:"#64748B"}}>
              {view==="mapa"?`${citasHoy} citas hoy`:view==="lista"?`${prospectos.filter(p=>p.estado!=="CLIENTE_ACTIVO").length} prospectos`:view==="checklist"?`${checkCount} pendientes`:view==="plan"?"Plan semanal":"Nueva clínica"}
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setShowNotif(true)} style={{position:"relative",background:"none",border:"none",cursor:"pointer",padding:4}}>
            <span style={{fontSize:22}}>🔔</span>
            {unread>0&&<span style={{position:"absolute",top:0,right:0,background:"#EF4444",color:"white",borderRadius:10,fontSize:9,fontWeight:700,padding:"1px 5px",minWidth:14,textAlign:"center"}}>{unread}</span>}
          </button>
          <Avatar name={CONFIG.CURRENT_USER.name} size={34}/>
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,overflow:"hidden"}}>
        {view==="mapa"&&<MapaDelDia prospectos={prospectos} onSelect={setSelected} onToast={showToast} addNotif={addNotif}/>}
        {view==="lista"&&<ListaDelDia prospectos={prospectos} onSelect={setSelected}/>}
        {view==="checklist"&&<Checklist prospectos={prospectos} onSelect={setSelected} onUpdate={updateP} onToast={showToast}/>}
        {view==="plan"&&<PlanSemanal prospectos={prospectos} onToast={showToast}/>}
        {view==="nueva"&&<NuevaClinica onToast={showToast} addNotif={addNotif} prospectos={prospectos}/>}
      </div>

      {/* Bottom Nav */}
      <div style={{display:"flex",background:"white",borderTop:"1px solid #F1F5F9",paddingBottom:"env(safe-area-inset-bottom,0px)",flexShrink:0}}>
        {VIEWS.map(v=>(
          <button key={v.id} onClick={()=>setView(v.id)} style={{flex:1,padding:"10px 0 8px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative"}}>
            <div style={{position:"relative"}}>
              <span style={{fontSize:20}}>{v.icon}</span>
              {v.badge>0&&<span style={{position:"absolute",top:-4,right:-8,background:"#EF4444",color:"white",borderRadius:10,fontSize:9,fontWeight:700,padding:"1px 5px",minWidth:14,textAlign:"center"}}>{v.badge}</span>}
            </div>
            <span style={{fontSize:9,fontWeight:view===v.id?700:500,color:view===v.id?"#0EA5E9":"#94A3B8"}}>{v.label}</span>
            {view===v.id&&<div style={{position:"absolute",top:0,left:"20%",right:"20%",height:2,background:"#0EA5E9",borderRadius:"0 0 2px 2px"}}/>}
          </button>
        ))}
      </div>

      {selected&&<ProspectoModal p={selected} onClose={()=>setSelected(null)} onUpdate={updateP} onToast={showToast} plan={INIT_PLAN[W0]} addNotif={addNotif}/>}
      {showNotif&&<NotifPanel notifications={notifs} onDismiss={dismissN} onClose={()=>setShowNotif(false)}/>}
      {toast&&<Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
        *{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}
        body{margin:0;background:#F8FAFC;overflow:hidden;}
        @keyframes slideUp{from{transform:translate(-50%,20px);opacity:0;}to{transform:translate(-50%,0);opacity:1;}}
        ::-webkit-scrollbar{width:0;}
        select,input,textarea{-webkit-appearance:none;font-family:inherit;}
      `}</style>
    </div>
  );
}
