import { BaseEntity } from "../../entities/base.entity.js";
import {
  Column,
  Entity,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Relation,
} from "typeorm";
import { User } from "./user.entity.js";
import { Session } from "./session.entity.js";

@Entity("refresh_token")
export class RefreshToken extends BaseEntity {
  @Column({ name: "user_id", type: "varchar", length: 255, nullable: true })
  userId: string;

  @Column({
    name: "refresh_token",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  refreshToken: string;

  @Column({ name: "expired_at", type: "date", nullable: true })
  expiredAt: Date;

  //   relations
  @ManyToOne(() => User, (user) => user.refreshToken, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: Relation<User>;

  @OneToMany(() => Session, (ses) => ses.refreshToken, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  session: Relation<Session[]>;
}
