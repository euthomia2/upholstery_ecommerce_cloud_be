import * as fs from 'fs';
import { Express } from 'express';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { BadRequestException } from '@nestjs/common/exceptions';
import { JwtService } from '@nestjs/jwt';
import { FileInterceptor } from '@nestjs/platform-express';
import { CategoryService } from 'src/category/category.service';
import { ShopService } from 'src/shop/shop.service';
import { ProductService } from './product.service';
import { DoSpacesService } from 'src/spaces-module/spaces-service/doSpacesService';
import { diskStorage } from 'multer';
import * as path from 'path';
import { UploadedMulterFileI } from 'src/spaces-module/spaces-service';

@Controller('product')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
    private readonly shopService: ShopService,
    private readonly jwtService: JwtService,
    private readonly doSpacesService: DoSpacesService,
  ) {}

  @Get('all')
  async findAll(@Req() request) {
    try {
      const cookie = request.cookies['user_token'];

      const data = await this.jwtService.verifyAsync(cookie);

      if (!data) {
        throw new UnauthorizedException();
      }

      return await this.productService.findAllProduct();
    } catch (e) {
      throw new UnauthorizedException();
    }
  }

  @Get('latest-products')
  async findAllLatestProducts() {
    return await this.productService.findLatestProducts();
  }

  @Get(':product_id')
  async findOne(@Req() request, @Param('product_id') productId) {
    try {
      const cookie = request.cookies['user_token'];

      const data = await this.jwtService.verifyAsync(cookie);

      if (!data) {
        throw new UnauthorizedException();
      }

      return this.productService.findById(parseInt(productId));
    } catch (e) {
      throw new UnauthorizedException();
    }
  }

  @Post('add')
  @UseInterceptors(FileInterceptor('image_file'))
  async addProduct(
    @Body() body: any,
    @Req() request,
    @UploadedFile() file: UploadedMulterFileI,
  ) {
    try {
      const cookie = request.cookies['user_token'];

      const data = await this.jwtService.verifyAsync(cookie);

      if (!data) {
        throw new UnauthorizedException();
      }

      const details = JSON.parse(body.details);

      if (Object.keys(details).length <= 1) return;

      const category = await this.categoryService.findById(details.category_id);

      if (!category) {
        throw new BadRequestException('No Category Found.');
      }

      const shop = await this.shopService.findById(details.shop_id);

      if (!shop) {
        throw new BadRequestException('No Shop Found.');
      }

      const uploadedUrl = await this.doSpacesService.uploadFile(
        file,
        details.shop_id,
        'products',
      );

      await this.productService.createProduct(
        details,
        uploadedUrl,
        category,
        shop,
      );

      return { message: 'Created Product Successfully.' };
    } catch (e) {
      console.log(e);
      if (e.response?.message === 'No Category Found.') {
        throw new BadRequestException('No Category Found.');
      } else if (e.response?.message === 'No Shop Found.') {
        throw new BadRequestException('No Shop Found.');
      } else {
        throw new UnauthorizedException();
      }
    }
  }

  @Patch('update/:product_id')
  @UseInterceptors(FileInterceptor('image_file'))
  async updateProduct(
    @Body() body: any,
    @Param('product_id') productId,
    @Req() request,
    @UploadedFile() file: UploadedMulterFileI,
  ) {
    try {
      const cookie = request.cookies['user_token'];

      const data = await this.jwtService.verifyAsync(cookie);

      if (!data) {
        throw new UnauthorizedException();
      }

      const details = JSON.parse(body.details);

      if (Object.keys(details).length <= 1) return;

      let category;
      let shop;

      if (details.category_id) {
        category = await this.categoryService.findById(details.category_id);

        if (!category) {
          throw new BadRequestException('No Category Found.');
        }
      }

      if (details.shop_id) {
        shop = await this.shopService.findById(details.shop_id);

        if (!shop) {
          throw new BadRequestException('No Shop Found.');
        }
      }

      const product = await this.productService.findById(productId);

      if (!product) {
        throw new BadRequestException('No Product Found.');
      }

      let uploadedUrl;

      if (details.image_file) {
        await this.doSpacesService.removeFile(
          `products/${product.shop.id}/${product.image_name}`,
        );

        if (details.shop_id) {
          uploadedUrl = await this.doSpacesService.uploadFile(
            file,
            details.shop_id,
            'products',
          );
        } else {
          uploadedUrl = await this.doSpacesService.uploadFile(
            file,
            product.shop.id,
            'products',
          );
        }
      } else if (details.shop_id) {
        uploadedUrl = await this.doSpacesService.renameFolder(
          'products',
          product.shop.id,
          details.shop_id,
          product.image_name,
        );
      }

      await this.productService.updateProduct(
        details,
        uploadedUrl,
        parseInt(productId),
        category,
        shop,
      );

      return { message: 'Updated product details successfully.' };
    } catch (e) {
      throw new UnauthorizedException();
    }
  }

  @Patch('deactivate/:product_id')
  async deactivateProduct(@Param('product_id') productId, @Req() request) {
    try {
      const cookie = request.cookies['user_token'];

      const data = await this.jwtService.verifyAsync(cookie);

      if (!data) {
        throw new UnauthorizedException();
      }

      const product = await this.productService.findById(productId);

      if (!product) {
        throw new BadRequestException('No Product Found.');
      }

      await this.productService.deactivateProduct(product.id);

      return { message: 'Deactivated category successfully.' };
    } catch (e) {
      if (e.response.message === 'No Product Found.') {
        throw new BadRequestException('No Product Found.');
      }
      throw new UnauthorizedException();
    }
  }

  @Patch('activate/:product_id')
  async activateProduct(@Param('product_id') productId, @Req() request) {
    try {
      const cookie = request.cookies['user_token'];

      const data = await this.jwtService.verifyAsync(cookie);

      if (!data) {
        throw new UnauthorizedException();
      }

      const product = await this.productService.findById(productId);

      if (!product) {
        throw new BadRequestException('No Product Found.');
      }

      await this.productService.activateProduct(product.id);

      return { message: 'Activated product successfully.' };
    } catch (e) {
      if (e.response.message === 'No Product Found.') {
        throw new BadRequestException('No Product Found.');
      }
      throw new UnauthorizedException();
    }
  }
}