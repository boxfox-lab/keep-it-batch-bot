import axios from 'axios';
import {
  FCMTokenEntity,
  NotifyEntity,
  NotifyPermissionEntity,
  UserEntity,
} from 'src/entity/keep-it';
import { In, Repository } from 'typeorm';

export class NotifyService {
  constructor(
    private readonly notify: Repository<NotifyEntity>,
    private readonly token: Repository<FCMTokenEntity>,
    private readonly permission: Repository<NotifyPermissionEntity>,
  ) {}

  async send(item: SendNotfyDTO) {
    await this.sendAll([item]);
  }

  async sendAll(items: SendNotfyDTO[]) {
    const filtered = await this.filter(items);

    const tokens = await this.token.find({
      where: {
        user: In(filtered.map((item) => item.user.id)),
      },
      relations: ['user'],
    });
    const row = filtered.map((item) => {
      const token = tokens.find((token) => token.user.id === item.user.id);
      return {
        to: token?.token,
        title: item.title,
        body: item.message,
      };
    });
    await axios.post('https://exp.host/--/api/v2/push/send', row);

    const history = filtered.map((item) => {
      const row = new NotifyEntity();
      row.content = item.message;
      row.title = item.title;
      row.user = item.user;
      row.isSent = true;
      row.time = new Date();
      return row;
    });
    await this.notify.save(history);
  }

  private async filter(items: SendNotfyDTO[]) {
    const permissions = await this.permission.find({
      where: {
        user: In(items.map((item) => item.user.id)),
      },
      relations: ['user'],
    });

    return items.filter((item) => {
      const permission = permissions.find(
        (permission) => permission.user.id === item.user.id,
      );
      // @TODO item.tag 처리 추가
      return permission?.isAllowSummaryFinished;
    });
  }
}

interface SendNotfyDTO {
  user: UserEntity;
  title: string;
  message: string;
  tag: string;
}
