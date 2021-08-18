

exports._pushKonter = async ({ that, konterData, confirmData }) => {
  that.spinner.start(`pushKonter ${konterData.nik} ${konterData.nama}`)

  await that.loginSilacak()

  if(that.response && JSON.stringify(that.response).includes(konterData.nik)){
    konterData.konter_silacak = true
    konterData = Object.assign({}, await that.upsertPerson({ person: Object.assign({}, konterData, {
      konter_silacak: true
    }) }), konterData)
    that.spinner.succeed(`cari konter by NIK in confirm tab | nik: ${konterData.nik}, exists: true, konter_silacak: ${konterData.konter_silacak}`)
    return 
  }


  let indeksExists = await that.cariConfirmByNIK({confirmData})

  if(indeksExists) {
    let [row] = await that.page.$x(`//tr[contains(.,'${confirmData.nik}')]`)
    while(!row){
      await that.page.waitForTimeout(100);
      [row] = await that.page.$x(`//tr[contains(.,'${confirmData.nik}')]`)
    }
    await that.page.waitForTimeout(500)
    let hrefEl = await row.$('td > a')
    let href = await that.page.evaluate( el => el.getAttribute('href').split('/')[el.getAttribute('href').split('/').length-1], hrefEl)

    that.response = false
      
    await row.$eval('td > a', e => e.click())
    
    // console.log(href)
  
    // await that.page.waitForResponse(response=> response.url().includes('.json') && response.url().includes(href) && response.status() === 200)
  
    if(!confirmData.href){
      confirmData.href = href
    }  


    await that.gotoKonterTab()

    while(!that.response){
      await that.page.waitForTimeout(100)
    }
  
    await that.page.waitForTimeout(500)
    // console.log(that.response)


    let btnTambahKonter = await that.page.$$eval('button.ant-btn-primary', els => els && els.length && [...els].filter( e => e.innerText 
      && e.innerText.toLowerCase().includes(`tambah kontak erat baru` )).length)

    while(!btnTambahKonter){
      btnTambahKonter = await that.page.$$eval('button.ant-btn-primary', els => els && els.length && [...els].filter( e => e.innerText 
        && e.innerText.toLowerCase().includes(`tambah kontak erat baru` )).length)
    }

    let exists = false
    
    // await that.page.waitForResponse(response=> response.url().includes(`Gf4Ojyk54rO`) && response.status() === 200)

    let noKonter = await that.page.$$eval('div.ant-empty', els => els && els.length && [...els].filter( e => e.innerText 
      && e.innerText.toLowerCase().includes('tidak ada kontak erat')).length)
    if(!noKonter){
      //--------------------------------------------------------------

      // warning: cari konter dulu di listnya konter dari konfirm

      // console.log(JSON.stringify(that.response[that.response.length-1].json))
      let [table] = await that.page.$x("//table[contains(., 'Nama')]")
      while(!table){
        ;[table] = await that.page.$x("//table[contains(., 'Nama')]")
      }
      // console.log(konterData.nik)
      exists = await that.page.evaluate( (el, nik) => el.innerText.includes(nik), table, konterData.nik)

      if(exists) {
        konterData.konter_silacak = true
        konterData = Object.assign({}, await that.upsertPerson({ person: Object.assign({}, konterData, {
          konter_silacak: true
        }) }), konterData)
        that.spinner.succeed(`cari konter by NIK in confirm tab | nik: ${konterData.nik}, exists: ${exists}, konter_silacak: ${konterData.konter_silacak}`)
      }

  
      //==============================================================

    } 

    if(!exists){
      await that.inputKonter({ konterData })
    }

  }
  // if(that.response.length) for(let konter of that.response) if(JSON.stringify(konter).includes(konterData.nik)){
  //   // that.spinner.succeed(`${JSON.stringify(konter)}`)
  //   let from = Object.fromEntries(konter.from.trackedEntityInstance.attributes.map( e => ([e.code, e.value])))
  //   let to = Object.fromEntries(konter.to.trackedEntityInstance.attributes.map( e => ([e.code, e.value])))
  //   that.spinner.succeed(`from ${JSON.stringify(from)}`)
  //   that.spinner.succeed(`to ${JSON.stringify(to)}`)
  // }
  
}

