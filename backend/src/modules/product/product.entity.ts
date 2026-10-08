import { BaseEntity } from "../../entities/base.entity.js";
import { Entity, Column } from "typeorm";

@Entity("product")
export class Product extends BaseEntity {
  @Column({
    name: "product_name",
    type: "varchar",
    nullable: true,
    length: 100,
  })
  productName: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  price: number;
}
