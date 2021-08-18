exports._cariConfirmByNIK = async ({ that, confirmData }) => {
  // that.spinner.start(`cariConfirmByNIK ${confirmData.nik}`)
  let exists

  await that.reload()


  // that.spinner.start(`cariConfirmByNIK nik: ${nik}`)
  // await that.page.type('input#nik', '3372026504730002')
  await that.page.type('input#nik', confirmData.nik)

  that.response = false
  await that.clickBtn({ text: 'Filter'})

  while(!that.response){
    await that.page.waitForTimeout(100)
  }

  await that.page.waitForTimeout(500)
  //   that.page.waitForResponse(response=>response.url().includes(`${nik}`) && response.status() === 200)
  // ])

  // console.log(JSON.stringify(that.response[that.response.length-1].json))
  let [table] = await that.page.$x("//table[contains(., 'Nama')]")
  while(!table){
    await that.page.waitForTimeout(100)
    ;[table] = await that.page.$x("//table[contains(., 'Nama')]")
  }
  await that.page.waitForTimeout(500)
  exists = await that.page.evaluate( (el, nik) => el.innerText.includes(nik), table, confirmData.nik)

  if(!exists){
    // console.log(confirmData)
    if(confirmData.isKonter){
      let person = that.people[Object.keys(that.people)
        .filter(iknik => confirmData.konter_kelurahan === that.people[iknik].konfirm_kelurahan 
          && confirmData.konter_indeks === that.people[iknik].konfirm_no)[0]]
      let namaIndeks = person.nama
      that.spinner.succeed(`${confirmData.nama} ${confirmData.nik}${confirmData.isKonter ? ` konter ${namaIndeks} tgl_kontak ${confirmData.konter_tgl_kontak}` : ''}${confirmData.isKonfirm && confirmData.isKonter? ' =>' : ''}${confirmData.isKonfirm ? ` konfirm tgl_onset ${confirmData.konfirm_tgl_onset}` : ''}`)
      // 2. push konter dari konfirm (1)
      // console.log(confirmData)
      if(!confirmData.konter_silacak){
        await that.pushKonter({ 
          konterData: confirmData, 
          confirmData: person
        })
      }

      if(confirmData.isKonfirm){
        // 3. push konter (2) yg jadi konfirm
        if(!confirmData.konfirm_silacak){
          await that.convertKonterToKonfirm({ 
            person: confirmData, 
            indeksKasus: person 
          })
          exists = await that.cariConfirmByNIK({confirmData})
        }
      }
      // that.spinner.succeed(`${person.nama}${person.isKonter ? ` konter ${namaIndeks} tgl_kontak ${person.konter_tgl_kontak}` : ''}${person.isKonfirm && person.isKonter? ' =>' : ''}${person.isKonfirm ? ` konfirm tgl_onset ${person.konfirm_tgl_onset}` : ''}`)

    } else {
      that.spinner.start(`pushConfirm ${confirmData.nama}`)
      await that.pushConfirm({ confirmData })

      await that.reload()

      
      await that.page.type('input#nik', confirmData.nik)
    
      that.response = false
      await that.clickBtn({ text: 'Filter'})
    
      while(!that.response){
        await that.page.waitForTimeout(100)
      }
      await that.page.waitForTimeout(500)
    

      // await that.page.waitForTimeout(500)
      //   that.page.waitForResponse(response=>response.url().includes(`${nik}`) && response.status() === 200)
      // ])
    
      // console.log(JSON.stringify(that.response[that.response.length-1].json))
      ;[table] = await that.page.$x("//table[contains(., 'Nama')]")
      while(!table){
        await that.page.waitForTimeout(100)
        ;[table] = await that.page.$x("//table[contains(., 'Nama')]")
      }
      await that.page.waitForTimeout(500)
      exists = await that.page.evaluate( (el, nik) => el.innerText.includes(nik), table, confirmData.nik)

    }
  
  }

  // that.spinner.succeed(`cariConfirmByNIK nik: ${nik}, exists: ${exists}`)
  return exists
}

