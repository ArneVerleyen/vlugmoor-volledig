import { NextFunction, Request, Response } from 'express';
import { default as multer } from 'multer';
const upload = multer({ dest: '../../uploads' });

import { NotFoundError } from '../../utilities';

class DataController {
  constructor() {}

  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const data = await Data.findById(id).exec();
      return res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  destroy = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    try {
      let data = null;

      let { mode } = req.query;

      switch (mode) {
        case 'delete':
        default:
          data = await Data.findOneAndRemove({ _id: id });
          break;
        case 'softdelete':
          data = await Data.findByIdAndUpdate(
            { _id: id },
            { _deletedAt: Date.now() }
          );
          break;
        case 'softundelete':
          data = await Data.findByIdAndUpdate(
            { _id: id },
            { _deletedAt: null }
          );
          break;
      }

      if (!data) {
        throw new NotFoundError();
      } else {
        return res.status(200).json({
          message: `Successful ${mode} the MetaData with id: ${id}!`,
          data,
          mode
        });
      }
    } catch (err) {
      next(err);
    }
  };

  edit = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    try {
      const data = await Data.findById(id).exec();

      if (!data) {
        throw new NotFoundError();
      } else {
        const vm = {
          data
        };
        return res.status(200).json(vm);
      }
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    try {
      const dataUpdate = {
        data: req.body.data
      };
      const data = await Data.findOneAndUpdate({ _id: id }, dataUpdate, {
        new: true
      }).exec();

      if (!data) {
        throw new NotFoundError();
      }
      return res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  store = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataCreate = new Data({
        data: req.body.data
      });
      const data = await dataCreate.save();
      console.log(data);
      return res.status(201).json({ id: data._id });
    } catch (err) {
      console.log(err);
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vm = {
        datas: await Data.find()
      };
      return res.status(200).json(vm);
    } catch (err) {
      next(err);
    }
  };
}

export default DataController;