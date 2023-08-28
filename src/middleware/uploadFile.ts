import path from 'path'
import multer from "multer";


const storage = multer.diskStorage({
	destination(req, file, cb) {
    switch(file.mimetype.split('/')[0]){
      case 'image':
        cb(null, `public/media/image`);
        break;
      case 'file':
        cb(null, `public/file`);
        break;
      case 'video':     
          if(file.mimetype === 'video/webm'){
            cb(null, `public/media/audio`);
            break;
          }
          cb(null, `public/media/video`);
          break;

    default:
      if(file.mimetype === 'application/octet-stream' || ''){
        cb(null, `public/media/audio`);
      }else{
        cb(null, `public/file`);
      }
      break;
    }
	},
	filename(req, file, cb) {
		cb(
			null,
			`${
				file.originalname.split('.')[0]
			}-global-town-${Date.now()}${path.extname(file.originalname)}`
				.toLowerCase()
				.replace(/_/g, '-')
				.replace(' ', '-')
		)

	},
})

export default multer({storage})
