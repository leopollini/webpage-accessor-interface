// Modules to control application life and create native browser window
const { app, BrowserWindow, nativeImage, Notification } = require('electron')
const path = require('node:path')

function createWindow () {
  let icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IB2cksfwAAAAlwSFlzAAAewgAAHsIBbtB1PgAABXtJREFUeJy1V2lsVFUUHkxE0IKoMSpWiVVcAA0qUZSoIdF/GCMSY1yiUYMiaoJLjEHUiEsEIxpXFBQ1QlSKSjSCtUjbsYVWOpQCVWhn35fO2tlnjt9329HpbExlepNv3rz77rv3O+d895z7NCIyFfgY8EoVLVtwn8gU9lQ1hRNYA0zW4OejEvOWbR3+uGywhNT/P4MJec8UVP/D6az84omOlchKEvAfa2Q7Fl160CMpvPK9a0jO3GWSZEZkozUkyw551UxP/eWTu3vcanwglRFnIl0NCbum3JNkNquspYcd8bTUNRmlJ5SQA8BJvxrEBwbrjEF5BguDizS0muVre1jieGGxzilbHJGqvFCWgB9WzNhtlg/gYlq4YK9dHuz1KMvOaDbKfhB54eigvNLvlyNDSZn6m1FssbR8gvBMbjLIIAhSHwxLrIJOigjQWh0mZ6NFZ/1ukm7Eeos9goVNyvKGFot8CwsfP+yVt40BtejcP6xKB/TEcvTTg48hPPM7bBWFWkRgmysi02DNJltYMJ88jNjPaDGLB5ZzkffhkUX7nLKizyd37nfJBujgtm6nvARvrB7wy8WtFozNKG/Vw4PGaEp50IRrqgSPIgIc0wihnQw3roZ73Vj4sjaLPPe3T95BzGdrrfI04n4DQnL9Hpt8Cuu50M/uYXFusoZlI/pOhRGtgzGJwIpHDnlkltaiwlqWgAsL0bL15hBeymCLxeUCWE5lM951IPQ6LKzDxE/AxadDB6cB9+L59N0muavHhUWsssYQwBiD7A3EpckblfNAbh7C0BdJVg4Bt9VrWOAULHR1u02afTHpDScUiYWdDrnvgFuJbya8wYUn7NCLBpi40yDToZNJ2BmPwlI+WwsSLyIk9MIy9NFyCnEHBNkJYtlSBNLZ4W6KbBVenoJtR9d/A7FdCwu4CL2gGVmYmLBTP+qeWAJdXIL3SJweOAgjHgB5kjkXntoXTBR7wAbl34iY3gN3Uvn92FaH4bKHIKRpsOgqeIQW5hahDr6ESNv8MfkCV4rwX49g3MJOu7wFL9zS5VAeuRnXRmdEvMkKGuBkz0Jcs9qsahdcCivodiqb/3OLUyehAjHRd2/o/XLCSEjOgbcuxHZ8/sig2tIG7IAuaGoztvJK9DG0RQRyjbGyxlNqn9/e7VLKnjhiPbOhp0yKpdopOI47GwRI9Mp2qwodkxQ92YCwUKz9Q6nRBD40B+V8vMz9zvhxy1DRxEXY1zkCNyFMlRqto+KZiino7+B2HWJuR4jLZUNFgFZxMDPau0g0b+oD8jJyAPf+k31eWQol39/rlq8Q70rtJ3dU6YWWzwWuQOK6XDt85T2fzUfuyJ9HEfgBiYdZbg4GU2Bz8pC756Q/YlylxpSrhZZ2+aLSjB3Q7BsN9muRnAJ5GlIEBhATpth1UO7aAlDN7GdRGoiWTia5RqVfBwuvQRjmtReD/Xz+mTU0mgALhymWUmrVAySUA+/Zz+fHOv14k2nZDi9tBRGKmGHd5hxSV94T25GyLbH/hKwI0FIqdQpApReC/Uwk1EatmyLAKsWiw1LMpOTIA++pYgo1PebjX5UEjiLz0QtMJqyAhWARohaYIceFQAuUuVjnkluRPBaVwR14zvI6LgTY6F6KLJYHnu8SOUCoyTyUOlz8bwLc3zzJ1KNaMY/nwOpVXwaslC018IgiQAt5YODZrwv1mjW7owTYz4MKx3Fb1kKUigAn+xzJYb2lPFh2Oa7WTRHg5LNRgFh2GYqZAMsp/xMsUEzH+RmslgSUI5nk0kpcxWD/2D8Bq2rqw8TLz60Fe+wVczg/TMbBA2YSeBUn4ixz9FaVt0ujEdAVnOeOs7EkLieBScAqspExfCUfR+MaA8AK4MR/AFLLexyZQmEmAAAAAElFTkSuQmCC')

  const mainWindow = new BrowserWindow({
    titleBarStyle: 'hidden',
    icon: icon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true
    }
  })
  mainWindow.setBackgroundColor('rgb(0, 184, 222)')
  mainWindow.setOverlayIcon(icon, 'PhlexHotel')
  mainWindow.menuBarVisible  = false

  mainWindow.loadURL("file://" + __dirname + "/tabs.html");
  mainWindow.maximize()

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

function showNotification () {
//  new Notification({ title: 'ATTENZIONE', body: 'Notifica di prova!' }).show()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}).then(showNotification)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
