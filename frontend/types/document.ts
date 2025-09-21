type UserDocument = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  title: string;
  fileName: string;
  filePath: string;
  fileKey: string;
  pageCount: number;
  deletedAt: Date | null;
};
