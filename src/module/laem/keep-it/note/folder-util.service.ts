import { entries, groupBy, uniq } from "lodash";
import { FolderEntity, FolderHistoryEntity } from "src/entity/keep-it";
import { FolderHistoryType } from "src/models/FolderHistoryType";
import { In, Repository } from "typeorm";

export class FolderUtilService {
  constructor(
    private readonly folderRepo: Repository<FolderEntity>,
    private readonly folderHistoryRepo: Repository<FolderHistoryEntity>,
  ) {}

  async getFolders(uids: number[]) {
    const folders = await this.folderRepo.find({
      where: {
        user: { id: In(uids) },
      },
      relations: ["user"],
    });
    return groupBy(folders, (i) => i.user.id);
  }

  async makeNewFolders(
    data: { uid: number; folder: { name: string; description: string } }[],
  ) {
    if (data.length === 0) {
      return [];
    }

    const prevFolders = await this.folderRepo.find({
      where: {
        user: { id: In(uniq(data.map((i) => i.uid))) },
      },
      relations: ["user"],
    });

    const newFolders: FolderEntity[] = [];

    entries(groupBy(data, (i) => i.uid)).forEach(([uid, folders]) => {
      const userPrevFolders = prevFolders.filter(
        (f) => f.user.id === Number(uid),
      );
      const newFoldersForUser = folders.filter(
        (f) => !userPrevFolders.some((pf) => pf.name === f.folder.name),
      );

      newFoldersForUser.forEach((folder) => {
        const newFolder = new FolderEntity();
        newFolder.name = folder.folder.name;
        newFolder.description = folder.folder.description;
        newFolder.user = { id: Number(uid) } as any;
        newFolders.push(newFolder);
      });
    });

    if (newFolders.length > 0) {
      const savedFolders = await this.folderRepo.save(newFolders);
      await this.folderHistoryRepo.save(
        savedFolders.map((f) => {
          const folderHistory = new FolderHistoryEntity();
          folderHistory.folder = f;
          folderHistory.user = { id: Number(f.user.id) } as any;
          folderHistory.type = FolderHistoryType.CREATE;
          return folderHistory;
        }),
      );
    }

    return newFolders;
  }
}
