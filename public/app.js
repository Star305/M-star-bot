const modal = document.getElementById("modal")

function openModal(){
modal.style.display="flex"
}

document.getElementById("deployForm").addEventListener("submit", async e=>{
e.preventDefault()
const formData = new FormData(e.target)

const res = await fetch("/deploy",{method:"POST",body:formData})
const data = await res.json()

if(res.ok){
alert("Deployment successful!")
modal.style.display="none"
loadPanels()
}else{
alert(data.error)
}
})

async function loadPanels(){
const res = await fetch("/panels")
const panels = await res.json()

const container = document.getElementById("panelList")
container.innerHTML=""

panels.forEach(name=>{
const div = document.createElement("div")
div.className="panel-card"
div.innerHTML=`
<span>${name}</span>
<button onclick="deletePanel('${name}')">Delete</button>
`
container.appendChild(div)
})
}

async function deletePanel(name){
await fetch("/panel/"+name,{method:"DELETE"})
loadPanels()
}

window.onload=()=>{
setTimeout(()=>document.getElementById("loader").style.display="none",1500)
loadPanels()
}
