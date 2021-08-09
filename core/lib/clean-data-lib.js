exports._checkIndeksKasus = async({that, person}) => that.people[Object.keys(that.people).filter(nik => that.people[nik].isKonfirm && that.people[nik].konfirm_kelurahan === person.konter_kelurahan && that.people[nik].konfirm_no === person.konter_indeks)[0]]

exports._cleanData = async ({ that }) => {
  that.spinner.start(`cleanData`)


  for(let nik of Object.keys(that.people)){
    let person = that.people[nik]

    if(person.isKonfirm){
      that.spinner.start(`konfirm_tgl_onset: ${person.konfirm_tgl_onset}`)
      if(!person.umur){
        person.umur = that.umur(person.nik.substring(8, 12)).toString()
      }
      if(!person.jk){
        person.jk = Number(person.nik[6]) > 3 ? 'P' : 'L'    
      }
      person.jk = person.jk.toLowerCase() === 'l' ? 'Laki' : 'Perempuan'

      Object.keys(person).map( k => {
        if(k.includes('konfirm') && k.includes('rujukan')){
          person.konfirm_tindakan = person[k]
          delete person[k]
        }
        if(k.includes('konfirm') && k.includes('gejala')){
          person.konfirm_gejala = person[k]
          delete person[k]
        }
      })

      if(person.konfirm_tindakan && (person.konfirm_tindakan.toLowerCase().includes('sembuh') || person.konfirm_tindakan.toLowerCase().includes('ninggal'))){
        person.konfirm_no_hp = '082226059060'
      }

      if(person.konfirm_no_hp && person.konfirm_no_hp[0] !== '0'){
        person.konfirm_no_hp = `0${person.konfirm_no_hp}`
      }

    }

    // that.listConfirms = that.listConfirms.filter(confirm => that.filter14(confirm.tgl_onset)).map( confirm => {
    //   return confirm
    // })

    if(person.isKonter){
      if(!person.umur){
        person.umur = that.umur(person.nik.substring(8, 12)).toString()
      }
      if(!person.jk){
        person.jk = Number(person.nik[6]) > 3 ? 'P' : 'L'    
      }
      person.jk = person.jk.toLowerCase() === 'l' ? 'Laki' : 'Perempuan'

      Object.keys(person).map( k => {
        if(k.includes('konter') && k.includes('indeks') && !k.includes('hubungan')){
          person.konter_indeks = person[k]
          delete person[k]
        }
      })

      if(person.konter_indeks && person.konter_indeks.toLowerCase().includes('no')){
        let noIndeksKasus = person.konter_indeks.toLowerCase().split('no')
        noIndeksKasus = noIndeksKasus[noIndeksKasus.length-1]
        if(noIndeksKasus.includes('.')){
          noIndeksKasus = noIndeksKasus.split('.').join('')
        }
        noIndeksKasus = noIndeksKasus.trim()
        person.konter_indeks = noIndeksKasus
      }

      if(!person.konter_no_hp && !person.konfirm_no_hp){
        person.konter_no_hp = '082226059060'
      }

      if(person.konter_no_hp && person.konter_no_hp[0] !== '0'){
        person.konter_no_hp = `0${person.konter_no_hp}`
      }
    }

  // that.listKonters = that.listKonters.filter( konter => konter.nik && konter.nik.length === 16 && Object.keys( konter ).filter( e => e.includes('nama_indeks')).length).map( konter => {
  // }).filter( konter => Number(konter.nama_indeks_kasus) == konter.nama_indeks_kasus)
  }

  let num = 0

  for(let nik of Object.keys(that.people)){

    let person = that.people[nik]

    let anc = 0
    if(person.isKonter && person.isKonfirm){
      num++
    }

    while(person && person.isKonter && person.isKonfirm){
      anc++

      that.spinner.succeed(`(${num}.${anc}) nik ${nik} ${person.nama} konter_kelurahan ${person.konter_kelurahan} indeks_kasus ${person.konter_indeks}`) //person ${JSON.stringify(person)}`)

      person = await that.checkIndeksKasus({person})

      if(person && !person.isKonter ){
        anc++
        that.spinner.succeed(`(${num}.${anc}) nik ${nik} => ${person.nik} ${person.nama} konfirm_kelurahan ${person.konfirm_kelurahan}`)
      }

    }
  

  }



}


