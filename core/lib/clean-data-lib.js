exports._cleanData = async ({ that }) => {
  that.spinner.start(`cleanData`)
  await that.fixTgl()

  for(let nik of Object.keys(that.people)){
    let person = Object.assign({}, await that.upsertPerson({person: that.people[nik]}), that.people[nik])

    if(person.isKonfirm){
      // that.spinner.start(`konfirm_tgl_onset: ${person.konfirm_tgl_onset}`)
      if(!person.umur){
        person.umur = that.umur(person.nik.substring(8, 12)).toString()
      }
      if(!person.jk){
        person.jk = Number(person.nik[6]) > 3 ? 'P' : 'L'    
      }
      person.jk = person.jk.toLowerCase() === 'l' ? 'Laki' : 'Perempuan'

      Object.keys(person).map( k => {
        if(person[k] && typeof person[k] === 'String' && person[k].toLowerCase().includes('invalid')){
          delete person[k]
        }
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

      if(!person.konfirm_no_hp){
        person.konfirm_no_hp = '082226059060'
      }

      person.konfirm_tgl_wawancara = person.konfirm_tgl_onset

      if(!that.filter14(person.konfirm_tgl_onset)){
        person.konfirm_tgl_wawancara = that.kurang13()
        person.konfirm_tgl_onset = that.kurang13()
      }

    }

    if(person.isKonter){
      if(!person.umur){
        person.umur = that.umur(person.nik.substring(8, 12)).toString()
      }
      if(!person.jk){
        person.jk = Number(person.nik[6]) > 3 ? 'P' : 'L'    
      }
      person.jk = person.jk.toLowerCase() === 'l' ? 'Laki' : 'Perempuan'

      Object.keys(person).map( k => {
        if(person[k] && typeof person[k] === 'String' && person[k].toLowerCase().includes('invalid')){
          delete person[k]
        }
        if(k.includes('indeks') && !k.includes('hubungan')){
          person.konter_indeks = person[k]
          delete person[k]
        }
        if(k.includes('tgl') || k.includes('tanggal')){
          if(k.includes('kontak')){
            person.konter_tgl_kontak = person[k]
          }
          if(k.includes('entry')){
            person.konter_tgl_entry = person[k]
          }
          if(k.includes('exit')){
            person.konter_tgl_exit = person[k]
          }
        } 
      })

      if(!person.konter_tgl_kontak){
        person.konter_tgl_kontak = that.kurang1(person.konter_tanggal_wawancara || person.konter_tgl_wawancara || person.konter_tanggal_lapor)
      }
      if(!person.konter_tgl_entry){
        person.konter_tgl_entry = that.tambah1(person.konter_tgl_kontak)
      }
      if(!person.konter_tgl_exit){
        person.konter_tgl_exit = that.tambah6(person.konter_tgl_kontak)
      }

      if(person.konter_indeks && person.konter_indeks.toLowerCase().includes('no')){
        let noIndeksKasus = person.konter_indeks.toLowerCase().split('no')
        noIndeksKasus = noIndeksKasus[noIndeksKasus.length-1]
        if(noIndeksKasus.includes('.')){
          noIndeksKasus = noIndeksKasus.split('.').join('')
        }
        noIndeksKasus = noIndeksKasus.trim()
        person.konter_indeks = noIndeksKasus
      }

      if(person.konter_no_hp && person.konter_no_hp[0] !== '0'){
        person.konter_no_hp = `0${person.konter_no_hp}`
      }

      if(!person.konter_no_hp && person.konfirm_no_hp){
        person.konter_no_hp = person.konfirm_no_hp
      }

      if(!person.konter_no_hp && !person.konfirm_no_hp){
        person.konter_no_hp = '082226059060'
      }

      if(person.konter_tanggal_wawancara){
        person.konter_tgl_wawancara = person.konter_tanggal_wawancara
      } else {
        person.konter_tgl_wawancara = person.konter_tgl_kontak
      }

      if(!that.filter14(person.konter_tgl_wawancara)){
        person.konter_tgl_wawancara = that.kurang13()
      }


    }

    person.nama = person.nama.split('.').join(' ').split(',').join(' ')
    if(person.isKonter && person.isKonfirm) {
      person.selisihEntryOnset = that.getSelisihHari(person.konter_tgl_entry, person.konfirm_tgl_onset)
      if(person.selisihEntryOnset < 1 ){
        person.selisihEntryOnset = 1
      }
    }

    that.people[nik] = Object.assign({}, that.people[nik], person)
  }

  //cari terkonfirmasi yg bukan konter
  that.indeksKasus = []
  for(let nik of Object.keys(that.people)){
    let person = that.people[nik]
    if(person && person.isKonfirm && !person.isKonter ){
      if(that.indeksKasus.indexOf(person.nik) < 0){
        that.indeksKasus.push(person.nik)
      }
    }
  }

  //urutkan indeks kasus bedasarkan ttgl onset
  that.indeksKasus.sort( (a,b) => that.sortDate(that.people[a].konfirm_tgl_onset) - that.sortDate(that.people[b].konfirm_tgl_onset))

  //tambah konter masing2 indeks kasus
  let cp = [...that.indeksKasus]


  // Cari konter masing2 konfirm, kmd array dikurangi, terus s.d. konter yg confirm habis.. kmd kurangi confirm yg bukan konter dan tdk punya konter
  for(let iknik of Object.keys(that.people)){
    let indeksKasus
    if(that.people[iknik].isKonter){
      indeksKasus = Object.keys(that.people)
      .filter(ik => that.people[iknik].konter_kelurahan === that.people[ik].konfirm_kelurahan 
        && that.people[iknik].konter_indeks === that.people[ik].konfirm_no)[0]

    }
    let konters = Object.keys(that.people).filter( nik => that.people[nik].isKonter 
      && that.people[nik].konter_indeks 
      && that.people[nik].konter_indeks === that.people[iknik].konfirm_no 
      && that.people[nik].konter_kelurahan === that.people[iknik].konfirm_kelurahan)
    konters.sort( (a,b) => that.sortDate(that.people[a].konter_tgl_kontak) - that.sortDate(that.people[b].konter_tgl_kontak))
    let hasKonter = !!konters.length
    that.people[iknik] = Object.assign({}, that.people[iknik], {
      hasKonter,
      konters,
      indeksKasus
    })

    hasKonter && that.indeksKasus.indexOf(iknik) < 0 && that.indeksKasus.push(iknik)
    hasKonter && that.indeksKasus.splice(that.indeksKasus.indexOf(iknik)+1, 0, ...konters)
  }

  that.indeksKasus = that.indeksKasus.filter( nik => {
    let a = Object.keys(that.people[nik])
    .filter( k => k.includes('tgl') || k.includes('tanggal'))
    .filter( k => !that.filter14(that.people[nik][k]))
    // if(that.people[nik].nama.includes('Ong')){
      // a.map( e => console.log(e, that.people[nik][e], that.filter14(that.people[nik][e])))
    // console.log(a)
    return a.length === 0
  }).filter( nik => !(that.people[nik].isKonfirm
    && !that.people[nik].isKonter
    && !that.people[nik].hasKonter
    )
    && that.people[nik].konter_tgl_exit ? that.isNowOrBefore(that.people[nik].konter_tgl_exit) : true
    )

}
