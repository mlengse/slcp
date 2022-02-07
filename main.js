if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}
const Core = require('./core')
const config = require('./config')

const app = new Core(config)

module.exports = async (isPM2) => {

  try{
    app.spinner.start('init apps')
    await app.fetchKasus()
    await app.cleanData()
    // await app.upsertData()

    // let num = 0
    for(let [num, nik] of Object.entries(app.indeksKasus))
    // if(app.filter14(app.people[nik].konfirm_tgl_onset))
    // if(app.people[nik].nama.toLowerCase().includes('rafi'))
    // if(num > 304 )
    {

      let person = app.people[nik]

      if(person.isKonfirm && !person.isKonter){
        num++
        if(!person.konfirm_silacak){
          // 1. push konfirm yg !konter
          await app.pushConfirm({ confirmData: person })
        }
      }

      let namaIndeks
      if(person.isKonter){
        // num++
        let confirmData = app.people[Object.keys(app.people)
          .filter(iknik => person.konter_kelurahan === app.people[iknik].konfirm_kelurahan 
            && person.konter_indeks === app.people[iknik].konfirm_no)[0]]
        if(confirmData && confirmData.nama){
          namaIndeks = confirmData.nama
          app.spinner.succeed(`${num} ${person.nama} ${person.nik}${person.isKonter ? ` konter ${namaIndeks} tgl_kontak ${person.konter_tgl_kontak}` : ''}${person.isKonfirm && person.isKonter? ' =>' : ''}${person.isKonfirm ? ` konfirm tgl_onset ${person.konfirm_tgl_onset}` : ''}`)
          // 2. push konter dari konfirm (1)
          if(!person.konter_silacak){
            await app.pushKonter({ 
              konterData: person, 
              confirmData
            })
          }

          if(person.isKonfirm){
            // 3. push konter (2) yg jadi konfirm
            if(!person.konfirm_silacak){
              await app.convertKonterToKonfirm({ person, indeksKasus: confirmData })
            }
          }
          // app.spinner.succeed(`${num} ${person.nama}${person.isKonter ? ` konter ${namaIndeks} tgl_kontak ${person.konter_tgl_kontak}` : ''}${person.isKonfirm && person.isKonter? ' =>' : ''}${person.isKonfirm ? ` konfirm tgl_onset ${person.konfirm_tgl_onset}` : ''}`)
        }
      }

      if(app.response.length) for(let konter of app.response) if(JSON.stringify(konter).includes(person.nik)){
        // that.spinner.succeed(`${JSON.stringify(konter)}`)
        let from = Object.fromEntries(konter.from.trackedEntityInstance.attributes.map( e => ([e.code, e.value])))
        let to = Object.fromEntries(konter.to.trackedEntityInstance.attributes.map( e => ([e.code, e.value])))
        app.spinner.succeed(`kontak erat: ${JSON.stringify(to)}`)
        app.spinner.succeed(`indeks kasus:  ${JSON.stringify(from)}`)
      }
    
      // app.spinner.succeed(`---------------------------------------------------`)
      await app.upsertPerson({person})
      // console.log(person)
    }

    await app.close(isPM2)

    console.log(`silacak process done: ${new Date()}`)
  }catch(e){
    console.error(`process error: ${new Date()} ${JSON.stringify(e, Object.getOwnPropertyNames(e))}`)
  }
}