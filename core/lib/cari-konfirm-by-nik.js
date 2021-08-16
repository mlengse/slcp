exports._cariConfirmByNIK = async ({ that, confirmData }) => {
  // that.spinner.start(`cariConfirmByNIK ${confirmData.nik}`)
  let exists

  await that.reload()

  // that.spinner.start(`cariConfirmByNIK nik: ${nik}`)
  // await that.page.type('input#nik', '3372026504730002')
  await that.page.type('input#nik', confirmData.nik)

  await that.clickBtn({ text: 'Filter'})

  await that.page.waitForTimeout(500)
  //   that.page.waitForResponse(response=>response.url().includes(`${nik}`) && response.status() === 200)
  // ])

  // console.log(JSON.stringify(that.response[that.response.length-1].json))
  let [table] = await that.page.$x("//table[contains(., 'Nama')]")
  while(!table){
    await that.page.waitForTimeout(500)
    ;[table] = await that.page.$x("//table[contains(., 'Nama')]")
  }
  await that.page.waitForTimeout(500)
  exists = await that.page.evaluate( (el, nik) => el.innerText.includes(nik), table, confirmData.nik)

  if(!exists){
    // console.log(confirmData)
    if(confirmData.isKonter){
      let person = confirmData
      confirmData = that.people[Object.keys(that.people)
        .filter(iknik => person.konter_kelurahan === that.people[iknik].konfirm_kelurahan 
          && person.konter_indeks === that.people[iknik].konfirm_no)[0]]
      let namaIndeks = confirmData.nama
      that.spinner.succeed(`${person.nama} ${person.nik}${person.isKonter ? ` konter ${namaIndeks} tgl_kontak ${person.konter_tgl_kontak}` : ''}${person.isKonfirm && person.isKonter? ' =>' : ''}${person.isKonfirm ? ` konfirm tgl_onset ${person.konfirm_tgl_onset}` : ''}`)
      // 2. push konter dari konfirm (1)
      console.log(confirmData)
      if(!person.konter_silacak){
        await that.pushKonter({ 
          konterData: person, 
          confirmData
        })
      }

      if(person.isKonfirm){
        // 3. push konter (2) yg jadi konfirm
        if(!person.konfirm_silacak){
          await that.convertKonterToKonfirm({ person, indeksKasus: confirmData })
          exists = await that.cariConfirmByNIK({confirmData: person})
        }
      }
      // app.spinner.succeed(`${num} ${person.nama}${person.isKonter ? ` konter ${namaIndeks} tgl_kontak ${person.konter_tgl_kontak}` : ''}${person.isKonfirm && person.isKonter? ' =>' : ''}${person.isKonfirm ? ` konfirm tgl_onset ${person.konfirm_tgl_onset}` : ''}`)

    } else {
      that.spinner.start(`pushConfirm ${confirmData.nama}`)
      await that.pushConfirm({ confirmData })

      await that.reload()
      
      await that.page.type('input#nik', confirmData.nik)
    
      await that.clickBtn({ text: 'Filter'})
    
      await that.page.waitForTimeout(500)
      //   that.page.waitForResponse(response=>response.url().includes(`${nik}`) && response.status() === 200)
      // ])
    
      // console.log(JSON.stringify(that.response[that.response.length-1].json))
      ;[table] = await that.page.$x("//table[contains(., 'Nama')]")
      while(!table){
        await that.page.waitForTimeout(500)
        ;[table] = await that.page.$x("//table[contains(., 'Nama')]")
      }
      await that.page.waitForTimeout(500)
      exists = await that.page.evaluate( (el, nik) => el.innerText.includes(nik), table, confirmData.nik)

    }
  
  }

  // that.spinner.succeed(`cariConfirmByNIK nik: ${nik}, exists: ${exists}`)
  return exists
}

