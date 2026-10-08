import { BaseEntity } from "../../entities/base.entity.js";
import { Column, Entity, OneToMany } from "typeorm";
import { RefreshToken } from "./token.entity.js";
import { Session } from "./session.entity.js";

@Entity("user")
export class User extends BaseEntity {
  @Column({ type: "varchar", length: 155 })
  name: string;

  @Column({ type: "varchar", length: 155 })
  email: string;

  @Column({
    name: "password_hash",
    type: "varchar",
    length: 255,
  })
  password: string;

  @Column({ name: "last_login", type: "datetime", nullable: true })
  lastLogin: Date;

  //   relations
  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshToken: RefreshToken[];

  @OneToMany(() => Session, (ses) => ses.user)
  session: Session[];
}
